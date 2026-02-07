import {pipeline} from '@xenova/transformers'

let embedder: any = null;

async function getEmbedder(){
    if(!embedder){
        console.log('Loading embedding model (first time only)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
    try{
        const model = await getEmbedder();
        const output = await model(text, { pooling: 'mean', normalize: true });

        const embedding = Array.from(output.data) as number[];
        return embedding;
    }
    catch(error){
        throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}