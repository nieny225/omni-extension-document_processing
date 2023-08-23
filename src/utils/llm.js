//@ts-check
// llm.js
import { is_valid, console_log, clean_string, pauseForSeconds } from './utils.js';
import { runBlock } from './blocks.js';
import { count_tokens_in_text } from './tiktoken.js';
import path from "path";
import os from "os";
import { omnilog } from 'mercs_shared';
import { walkDirForExtension, validateFileExists, readJsonFromDisk, fetchJsonFromUrl } from './files.js';
// import { createCompletion, loadModel } from '../gpt4all/gpt4all.js';
// import { DEFAULT_DIRECTORY as LLM_GPT4ALL_CACHE_DIRECTORY } from '../gpt4all/config.js';


const LLM_CONTEXT_SIZE_MARGIN = 500;
const GPT3_MODEL_SMALL = "gpt-3.5-turbo";
const GPT3_MODEL_LARGE = "gpt-3.5-turbo-16k";
const GPT3_SIZE_CUTOFF = 4096 - LLM_CONTEXT_SIZE_MARGIN;
const DEFAULT_GPT_MODEL = GPT3_MODEL_LARGE;

const GPT4_MODEL_SMALL = "gpt-4";
const GPT4_MODEL_LARGE = "gpt-4-32k";
const GPT4_SIZE_CUTOFF = 8192 - LLM_CONTEXT_SIZE_MARGIN;
const GPT4_SIZE_MAX = 32768 - LLM_CONTEXT_SIZE_MARGIN;

const MODEL_TYPE_OPENAI = "openai";
const MODEL_TYPE_OOBABOOGA = "other";
const DEFAULT_UNKNOWN_CONTEXT_SIZE = 4096;
const DEFAULT_UNKNOWN_MEMORY_NEED = 8192;

const LLM_USER_PROVIDED_MODELS_DIRECTORY = path.resolve(process.cwd(), "user_provided_models");
const LLM_LM_STUDIO_CACHE_DIRECTORY = path.resolve(os.homedir(), ".cache/lm-studio", "models");

//const oobabooga_model_dir_json = await readJsonFromDisk(path.resolve(process.cwd(), "etc", "registry" ,"oobabooga", "oobabooga_models_directory.json"));
const oobabooga_model_dir_json = await readJsonFromDisk(path.resolve(process.cwd(), "..", ".." ,"user_files", "oobabooga_models_directory.json"));

//debug
omnilog.warn(`oobabooga_model_dir_json = ${JSON.stringify(oobabooga_model_dir_json)}`);

const OOBABOOGA_MODEL_DIRECTORY = oobabooga_model_dir_json.models_path;
const LLM_LOCATION_OPENAI_SERVER = "openai_server";
const LLM_LOCATION_GPT4ALL_CACHE = "gpt4all_cache";
const LLM_LOCATION_LM_STUDIO_CACHE = "lm_studio_cache";
const LLM_LOCATION_USER_PROVIDED = "user_provided";
const LLM_LOCATION_GPT4ALL_SERVER = "gpt4all_server";
const LLM_LOCATION_OOBABOOGA_LOCAL = "oobabooga";

const BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT = "oobabooga.simpleGenerateText";
const BLOCK_OOBABOOGA_MANAGE_MODEL = "oobabooga.manageModelComponent";
const BLOCK_OPENAI_ADVANCED_CHATGPT = "openai.advancedChatGPT";
const BLOCK_OPENAI_SIMPLE_CHATGPT = "openai.simpleChatGPT";

//const {
//    DEFAULT_DIRECTORY,
//    DEFAULT_LIBRARIES_DIRECTORY,
//    DEFAULT_PROMPT_CONTEXT,
//    DEFAULT_MODEL_CONFIG,
//    DEFAULT_MODEL_LIST_URL,
//} = require("../gpt4all/config.js");


const llm_remote_models = [
    { model_name: "gpt-3.5-turbo", model_type: MODEL_TYPE_OPENAI, memory_need: 0, context_size: 4096, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-3.5-turbo-16k", model_type: MODEL_TYPE_OPENAI, memory_need: 0, context_size: 16384, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-4", model_type: MODEL_TYPE_OPENAI, memory_need: 0, context_size: 8192, location: LLM_LOCATION_OPENAI_SERVER },
    { model_name: "gpt-4-32k", model_type: MODEL_TYPE_OPENAI, memory_need: 0, context_size: 32768, location: LLM_LOCATION_OPENAI_SERVER },
    //{ model_name: "local", title: "local via Text Generation Webui", model_type: MODEL_TYPE_OOBABOOGA, memory_need: 0, context_size: 2048, location: LLM_LOCATION_OOBABOOGA_LOCAL },
    /*
    { model_name: "ggml-gpt4all-j-v1.3-groovy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER},
    { model_name: "ggml-gpt4all-j-v1.2-jazzy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-j-v1.1-breezy.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location:LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-j.bin", model_type: "gptj", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-gpt4all-l13b-snoozy.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-vicuna-7b-1.1-q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-vicuna-13b-1.1-q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER},
    { model_name: "ggml-wizardLM-7B.q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-stable-vicuna-13B.q4_2.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-nous-gpt4-vicuna-13b.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-v3-13b-hermes-q5_1.bin", model_type: "llama", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-base.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-chat.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-mpt-7b-instruct.bin", model_type: "mpt", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },
    { model_name: "ggml-replit-code-v1-3b.bin", model_type: "replit", memory_need: 8192, context_size: 4096, location: LLM_LOCATION_GPT4ALL_SERVER },*/
];
// TBD: read that info from online source
const llm_model_types = {};
const llm_context_sizes = {};
const llm_memory_needs = {};
const llm_location = {};
const llm_local_choices = {};
const llm_titles = {};
const loaded_models = {};
const llm_descriptions = {};
const JSON_URL = "https://raw.githubusercontent.com/nomic-ai/gpt4all/main/gpt4all-chat/metadata/models.json";



function getDefaultModelContextSizeFromModelType(model_type, model_name)
{
    model_type = model_type.toLowerCase();
    switch (model_type)
    {
        case 'llama':
        case 'openllama':
            return 2048;
        case 'llama2':
            return 4096;
        case 'falcon':
            return 2048;
        case 'gptj':

            return 4096;
        case 'gptj-30b':
            return 8192;
        case 'mpt':
            return 4096;
        case 'replit':
            return 2048; // but really, we don't know ( 'support variable context length at inference time' )
        case 'openai':
            if (model_name == GPT3_MODEL_SMALL) return 4096;
            if (model_name == GPT3_MODEL_LARGE) return 16384;
            if (model_name == GPT4_MODEL_SMALL) return 8192;
            if (model_name == GPT4_MODEL_LARGE) return 32768;
            return 4096;
        default:
            return 2048;
    }
}


async function getLlmChoices(ctx)
{

    await add_local_llm_choices(OOBABOOGA_MODEL_DIRECTORY, MODEL_TYPE_OOBABOOGA, LLM_LOCATION_OOBABOOGA_LOCAL);

    //debug
    omnilog.warn(`llm_local_choices = ${JSON.stringify(llm_local_choices)}`);
    
    /*
    await add_local_llm_choices(LLM_GPT4ALL_CACHE_DIRECTORY, LLM_LOCATION_GPT4ALL_CACHE);
    await add_local_llm_choices(LLM_LM_STUDIO_CACHE_DIRECTORY, LLM_LOCATION_LM_STUDIO_CACHE);
    await add_local_llm_choices(LLM_USER_PROVIDED_MODELS_DIRECTORY, LLM_LOCATION_USER_PROVIDED);
    */

    const choices = [];

    const remote_models = Object.values(llm_remote_models);
    for (const model of remote_models)
    {

        let name = model.model_name;

        const title = model.title || deduceLlmTitle(name, true);
        const description = model.description || deduce_llm_description(name, model.context_size);

        if (name in llm_model_types == false) llm_model_types[name] = model.model_type;
        if (name in llm_context_sizes == false) llm_context_sizes[name] = model.context_size;
        if (name in llm_memory_needs == false) llm_memory_needs[name] = model.memory_need;
        if (name in llm_location == false) llm_location[name] = model.location;
        if (name in llm_titles == false) llm_titles[name] = model.title;
        if (name in llm_descriptions == false) llm_descriptions[name] = model.description;
        // we do NOT add name to llm_local_choices on purpose to distinguish between local and remote models

        choices.push({ value: name, title: title, description: description });
    };

    
    const local_choices = Object.values(llm_local_choices);
    for (const choice of local_choices)
    {
        choices.push(choice);
    }

    return choices;
}

async function add_local_llm_choices(model_dir, default_model_type, location, check_json = false) 
{
    // adding externally downloaded llms
    let filePaths = [];
    omnilog.warn(`external model_dir = ${model_dir}`);

    filePaths = await walkDirForExtension(filePaths, model_dir, '.bin');
    omnilog.warn(`external filePaths # = ${filePaths.length}`);

    for (const filepath of filePaths)
    {
        const name = path.basename(filepath);
        omnilog.warn(`name = ${name}`);
        const jsonPath = filepath.replace('.bin', '.json');
        let title, description, model_type, context_size, memory_need;

        if (name in llm_model_types == false) 
        {
            
            omnilog.warn(`not known yet: ${name}`);
            if (check_json && await validateFileExists(jsonPath)) 
            {

                const jsonContent = await readJsonFromDisk(jsonPath);
                title = jsonContent.title ?? deduceLlmTitle(name);;
                description = jsonContent.description ?? deduce_llm_description(name, jsonContent.context_size ?? 0);
                model_type = jsonContent.model_type ?? default_model_type;
                context_size = jsonContent.context_size ?? DEFAULT_UNKNOWN_CONTEXT_SIZE;
                memory_need = jsonContent.memory_need ?? DEFAULT_UNKNOWN_MEMORY_NEED;

            }
            else 
            {
                
                title = deduceLlmTitle(name, false);
                description = deduce_llm_description(name);
                model_type = default_model_type;
                context_size = DEFAULT_UNKNOWN_CONTEXT_SIZE;
                memory_need = DEFAULT_UNKNOWN_MEMORY_NEED;

            }

            llm_model_types[name] = model_type;
            llm_context_sizes[name] = context_size;
            llm_memory_needs[name] = memory_need;
            llm_location[name] = location;
            const choice = { value: name, title: title, description: description };
            llm_local_choices[name] = choice;

            omnilog.warn(`added: ${name} with choices: ${JSON.stringify(choice)}`);
        }
    }

}

function adjust_model(text_size, current_model)
{
    if (current_model in llm_model_types == false) return current_model;
    if (llm_model_types[current_model] != MODEL_TYPE_OPENAI) return current_model;

    if (typeof text_size !== 'number')
    {
        throw new Error(`adjust_model: text_size is not a string or a number: ${text_size}, type=${typeof text_size}`);
    }

    if (current_model == GPT3_MODEL_SMALL) return current_model;

    if (current_model == GPT3_MODEL_LARGE)
    {
        if (text_size < GPT3_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return current_model;
    }

    if (current_model == GPT4_MODEL_SMALL) return current_model;

    if (current_model == GPT4_MODEL_LARGE)
    {
        if (text_size < GPT4_SIZE_CUTOFF) return GPT3_MODEL_SMALL; else return current_model;
    }

    throw new Error(`pick_model: Unknown model: ${current_model}`);
}

function get_model_max_size(model_name, use_a_margin = true)
{
    if (use_a_margin == false) return get_model_context_size(model_name);
    const safe_size = Math.floor(get_model_context_size(model_name) * 0.9);
    return safe_size;
}

async function fix_with_llm(ctx, json_string_to_fix)
{
    // TBD use 'selected LLM' here instead of chatGPT
    console_log(`[FIXING] fix_with_llm: Fixing JSON string with LLM: ${json_string_to_fix}`);
    let response = null;
    let args = {};
    args.user = ctx.userId;
    args.prompt = json_string_to_fix;
    args.instruction = "Fix the JSON string below. Do not output anything else but the carefully fixed JSON string.";;
    args.temperature = 0;
    args.top_p = 1;

    try
    {
        response = await runChatGPTBlock(ctx, args);
        console_log(`Response from advncedChatGPT: ${JSON.stringify(response)}`);
    }
    catch (err)
    {
        console.error(`[FIXING] fix_with_llm: Error fixing json with GPT-3: ${err}`);
        return null;
    }

    let text = response?.answer_text || "";
    console_log(`[FIXING] fix_with_llm: text: ${text}`);

    if (is_valid(text) === false) return null;

    return text;

}

async function fix_json_string(ctx, passed_string) 
{

    if (is_valid(passed_string) === false)
    {
        throw new Error(`[FIXING] fix_json_string: passed string is not valid: ${passed_string}`);

    }
    if (typeof passed_string !== 'string')
    {
        throw new Error(`[FIXING] fix_json_string: passed string is not a string: ${passed_string}, type = ${typeof passed_string}`);
    }

    // Replace \n with actual line breaks
    let cleanedString = passed_string.replace(/\\n/g, '\n');
    let jsonObject = null;
    let fixed = false;
    let attempt_count = 0;
    let attempt_at_cleaned_string = cleanedString;
    while (fixed === false && attempt_count < 10)
    {
        attempt_count++;
        console_log(`[FIXING] Attempting to fix JSON string after ${attempt_count} attempts.\n`);

        try 
        {
            jsonObject = JSON.parse(attempt_at_cleaned_string);
        }
        catch (err)
        {
            console.error(`[FIXING] [${attempt_count}] Error fixing JSON string: ${err}, attempt_at_cleaned_string: ${attempt_at_cleaned_string}`);
        }

        if (jsonObject !== null && jsonObject !== undefined)
        {
            fixed = true;
            console_log(`[FIXING] Successfully fixed JSON string after ${attempt_count} attempts.\n`);
            return jsonObject;
        }


        let response = await fix_with_llm(ctx, passed_string);
        if (response !== null && response !== undefined)
        {
            attempt_at_cleaned_string = response;
        }
        await pauseForSeconds(0.5);

    }

    if (fixed === false)
    {
        throw new Error(`Error fixing JSON string after ${attempt_count} attempts.\ncleanedString: ${cleanedString})`);
    }

    return "{}";
}

function get_llm_type(model_name)
{
    if (model_name in llm_model_types == false) return MODEL_TYPE_OOBABOOGA;
    const model_type = llm_model_types[model_name];
    return model_type;
}

function get_model_context_size(model_name)
{
    if (model_name in llm_context_sizes == false) return DEFAULT_UNKNOWN_CONTEXT_SIZE;
    const context_size = llm_context_sizes[model_name];
    return context_size;
}

async function queryLlm(ctx, prompt, instruction, model_name = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
{
    let response = null;

    if (get_llm_type(model_name) == MODEL_TYPE_OPENAI)
    {

        response = await query_openai_llm(ctx, prompt, instruction, model_name, llm_functions, temperature, top_p);
    }
    else
    {
        const prompt_and_instructions = `${instruction}\n\n${prompt}`;
        response = await queryOobaboogaLlm(ctx, prompt_and_instructions, model_name, temperature);
    }

    return response;
}

async function query_openai_llm(ctx, prompt, instruction, model = GPT3_MODEL_SMALL, llm_functions = null, temperature = 0, top_p = 1)
{

    let args = {};
    args.user = ctx.userId;
    args.prompt = prompt;
    args.instruction = instruction;
    args.temperature = temperature;
    args.top_p = top_p;
    args.model = model;
    if (is_valid(llm_functions)) args.functions = llm_functions;

    console_log(`[query_advanced_chatgpt] args: ${JSON.stringify(args)}`);

    const response = await runChatGPTBlock(ctx, args);
    if (response.error) throw new Error(response.error);

    const total_tokens = response?.usage?.total_tokens || 0;
    let text = response?.answer_text || "";
    const function_arguments_string = response?.function_arguments_string || "";
    let function_arguments = null;

    if (is_valid(function_arguments_string) == true) function_arguments = await fix_json_string(ctx, function_arguments_string);
    if (is_valid(text) == true) text = clean_string(text);

    const return_value = {
        text: text,
        function_arguments_string: function_arguments_string,
        function_arguments: function_arguments,
        total_tokens: total_tokens
    };

    return return_value;
}

async function runChatGPTBlock(ctx, args) 
{
    const prompt = args.prompt;
    const instruction = args.instruction;
    const model = args.model;

    const prompt_cost = count_tokens_in_text(prompt);
    const instruction_cost = count_tokens_in_text(instruction);
    const cost = prompt_cost + instruction_cost;

    args.model = adjust_model(cost, model);

    let response = null;
    try
    {
        response = await runBlock(ctx, BLOCK_OPENAI_ADVANCED_CHATGPT, args);
    }
    catch (err)
    {
        let error_message = `Error running openai.advancedChatGPT: ${err.message}`;
        console.error(error_message);
        throw err;
    }
    return response;
}


function deduceLlmTitle(name, paid = true)
{
    let title = name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    if (paid) title = '[$]' + title;
    else title = '[\u2B07]' + title;
    return title;
}

function deduce_llm_description(name, context_size = 0)
{
    let description = name.substring(0, name.length - 4); // remove ".bin"
    if (context_size > 0) description += ` (${Math.floor(context_size / 1024)}k)`;
    return description;
}

function parseOobaboogaModelResponse(model_response)
{
    let nestedResult = JSON.parse(JSON.stringify(model_response));
    omnilog.warn(`nestedResult = ${JSON.stringify(nestedResult)}`);

    // Rename the keys
    if (nestedResult['shared.settings']) {
        nestedResult.settings = nestedResult['shared.settings'];
        delete nestedResult['shared.settings'];
    }
    
    if (nestedResult['shared.args']) {
        nestedResult.args = nestedResult['shared.args'];
        delete nestedResult['shared.args'];
    }

    omnilog.warn(`nestedResult (after) = ${JSON.stringify(nestedResult)}`);
    return nestedResult;
}

async function queryOobaboogaLlm(ctx, prompt, model_name, temperature = 0.3)
{
    // for now, for this to work we need:
    // 1. a model manually copied into oobabbooga's models directory 
    // 2. in oobabooga session tab, options --api and --listen checked (or used as cmdline parameters when launching oobabooga)

    let model_response = await getOobaboggaCurrentModelInfo(ctx);
    omnilog.warn(`model_response = ${JSON.stringify(model_response)}`);

    // Parsing the nested JSON string inside the 'result' property
    let nestedResult = parseOobaboogaModelResponse(model_response);
    
    let loaded_model = nestedResult?.model_name;
    const context_size = nestedResult?.settings?.max_new_tokens_max || 0;
    omnilog.warn(`context_size = ${context_size}`);

    omnilog.warn(`nestedResult (1) = ${JSON.stringify(nestedResult)}, loaded_model = ${loaded_model}, model_name = ${model_name}, ==? ${loaded_model == model_name}`);

    if (loaded_model != model_name)
    {
        model_response = await loadOobaboogaModel(ctx, model_name);
        nestedResult = parseOobaboogaModelResponse(model_response);
        loaded_model = nestedResult?.model_name;

        //debug
        omnilog.warn(`nestedResult (2) = ${JSON.stringify(nestedResult)}, loaded_model = ${loaded_model}, model_name = ${model_name}, ==? ${loaded_model == model_name}`);
    }
    
    if (loaded_model != model_name) throw new Error (`Failed to load model ${model_name} into oobabooga`);

    let args = {};
    //args.user = ctx.userId;
    args.prompt = prompt;
    args.temperature = temperature;
    // args.top_p = top_p;
    // TBD: find a way to support functions

    console_log(`[query_oobabooga_llm] args: ${JSON.stringify(args)}`);

    const response = await runBlock(ctx, BLOCK_OOBABOOGA_SIMPLE_GENERATE_TEXT, args);
    if (response.error) throw new Error(response.error);

    const results = response?.results || [];
    if (results.length == 0) throw new Error("No results returned from oobabooga");

    const text = results[0].text || null;
    if (!text) throw new Error("Empty text result returned from oobabooga. Did you load a model in oobabooga?");

    const return_value = {
        text: text,
        function_arguments_string: "",
        function_arguments: null,
        total_tokens: 0,
    };

    //DEBUG
    omnilog.warn(`oobabooga return value = ${JSON.stringify(return_value)}`);

    return return_value;

}



async function getOobaboggaCurrentModelInfo(ctx)
{
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "info" });

    //{'model_name': shared.model_name,
    //'lora_names': shared.lora_names,
    //'shared.settings': shared.settings,
    //'shared.args': vars(shared.args),}

    return response?.result;
}


async function loadOobaboogaModel(ctx, model_name)
{
    const response = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "load", model_name: model_name });
    return response.result;
}

async function readLocalOobaboogaChoices(ctx)
{
    const model_names = await runBlock(ctx, BLOCK_OOBABOOGA_MANAGE_MODEL, { action: "list" });


    //DEBUG
    omnilog.warn(`oobabooga model_names = ${JSON.stringify(model_names)}`);

    for (const model_name in model_names)
    {
        omnilog.warn(`name = ${model_name}`);
        let title, description, model_type, context_size, memory_need;

        if (model_name in llm_model_types == false) 
        {
            omnilog.warn(`not known yet: ${model_name}`);
            {
                title = deduceLlmTitle(model_name, false);
                description = deduce_llm_description(model_name);
                model_type = MODEL_TYPE_OOBABOOGA;
                context_size = DEFAULT_UNKNOWN_CONTEXT_SIZE;
                memory_need = DEFAULT_UNKNOWN_MEMORY_NEED;
            }

            llm_model_types[model_name] = model_type;
            llm_context_sizes[model_name] = context_size;
            llm_memory_needs[model_name] = memory_need;
            llm_location[model_name] = LLM_LOCATION_OOBABOOGA_LOCAL;

            const choice = { value: model_name, title: title, description: description };
            llm_local_choices[model_name] = choice;

            omnilog.warn(`added: ${model_name} with choices: ${JSON.stringify(choice)}`);
        }
    }
}


export { queryLlm, runChatGPTBlock, get_model_max_size, adjust_model, getLlmChoices };
export { DEFAULT_GPT_MODEL, GPT4_SIZE_MAX }

