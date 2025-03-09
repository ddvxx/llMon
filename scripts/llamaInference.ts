import { initLlama } from "llama.rn";


export const loadModel = async (modelPath: string) => {
    const context = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 1024,
        n_gpu_layers: 50,
        use_progress_callback: true
    });

    return context;
};
