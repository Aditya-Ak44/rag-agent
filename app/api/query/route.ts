import { Ollama } from "ollama";
import { NextRequest, NextResponse} from "next/server";
import * as path from "path";
import * as fs from "fs";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { Chroma } from "@langchain/community/vectorstores/chroma";
interface VectorStore {
  id: string;
  name: string;
  embeddingModel: string;
  fileCount: number;
  chunkCount: number;
  createdAt: string;
  status: "ready" | "processing";
}
const STORES_DIR = path.join(process.cwd(), "chroma_data");

export async function POST(req: NextRequest) {
  try {
    const { storeId, query, topK = 3 } = await req.json();

    if (!storeId || !query) {
      return NextResponse.json(
        { success: false, error: "Missing storeId or query" },
        { status: 400 }
      );
    }

    const metaPath = path.join(STORES_DIR, storeId, "meta.json");

    if (!fs.existsSync(metaPath)) {
      return NextResponse.json(
        { success: false, error: "Vector store not found" },
        { status: 404 }
      );
    }

    const meta: VectorStore = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    // Create embeddings
    console.log(`Loading embeddings: ${meta.embeddingModel}...`);
    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: meta.embeddingModel,
    });

    // Connect to Chroma and load vector store
    console.log(`Querying Chroma collection: ${storeId}...`);
    const vectorStore = new Chroma(embeddings, {
      collectionName: storeId,
      url: "http://localhost:8000",
    });

    // Search for similar documents
    const results = await vectorStore.similaritySearch(query, topK);

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          answer: "No relevant documents found in the vector store.",
          sourceCount: 0,
          embeddingModel: meta.embeddingModel,
        },
      });
    }

    // Format context
    const context = results
      .map((doc, i) => {
        const source = doc.metadata?.source || "Unknown";
        return `[Document ${i + 1} - ${source}]\n${doc.pageContent}`;
      })
      .join("\n\n---\n\n");

    // Generate answer using Ollama
    console.log("Generating answer with Ollama (qwen2:7b)...");
    const ollama = new Ollama();

    const systemPrompt = `You are a helpful assistant that answers questions based on provided documents.
Always cite which document you're referencing. If the answer is not in the documents, say so clearly.
Keep answers concise and focused. Use numbered citations like [Document 1], [Document 2], etc.`;

    const augmentedPrompt = `Context from documents:
${context}

Question: ${query}

Please answer based only on the context provided above.`;

    const response = await ollama.generate({
      model: "qwen2:7b",
      prompt: augmentedPrompt,
      system: systemPrompt,
      stream: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        answer: response.response.trim(),
        sourceCount: results.length,
        embeddingModel: meta.embeddingModel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Query error:", message);

    return NextResponse.json(
      { success: false, error: `Query failed: ${message}` },
      { status: 500 }
    );
  }
}