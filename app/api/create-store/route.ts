import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { Document } from "langchain/document";
import { ChromaClient } from "chromadb";

// Metadata interface for vector store
interface StoreMetaData {
  id: string;
  name: string;
  embeddingModel: string;
  fileCount: number;
  chunkCount: number;
  createdAt: string;
  status: string;
}

const STORES_DIR = path.join(process.cwd(), "chroma_data");
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;
  let storeDir: string | null = null;

  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll("files");
    const files: File[] = rawFiles.filter(
      (f): f is File => typeof f === "object" && "arrayBuffer" in f && "name" in f
    );
    const storeName = formData.get("storeName") as string;
    const embeddingModel = formData.get("embeddingModel") as string;

    // Validation
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (!storeName || !storeName.trim()) {
      return NextResponse.json(
        { success: false, error: "Store name is required" },
        { status: 400 }
      );
    }

    if (!embeddingModel || !embeddingModel.trim()) {
      return NextResponse.json(
        { success: false, error: "Embedding model is required" },
        { status: 400 }
      );
    }

    // Setup directories
    const storeId = uuidv4();
    storeDir = path.join(STORES_DIR, storeId);
    tempDir = path.join(storeDir, "temp");

    fs.mkdirSync(storeDir, { recursive: true });
    fs.mkdirSync(tempDir, { recursive: true });

    // Validate and save uploaded PDF files
    const savedPaths: string[] = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.name}. Only PDFs are supported.` },
          { status: 400 }
        );
      }

      const buffer = await file.arrayBuffer();
      const filePath = path.join(tempDir, file.name);
      fs.writeFileSync(filePath, Buffer.from(buffer));
      savedPaths.push(filePath);
    }

    console.log(`Loading ${savedPaths.length} PDF(s)...`);

    // Load PDF documents
    const allDocs: Document[] = [];
    for (const filePath of savedPaths) {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      allDocs.push(...docs);
    }

    if (allDocs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No pages could be extracted from the provided PDFs" },
        { status: 400 }
      );
    }

    console.log(`Loaded ${allDocs.length} pages`);

    // Split documents into chunks
    // Larger chunk size reduces number of embeddings needed
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 400,
    });
    const chunks = await splitter.splitDocuments(allDocs);
    console.log(`Created ${chunks.length} chunks`);

    // Initialize Ollama embeddings
    console.log(`Creating embeddings with Ollama model: ${embeddingModel}...`);
    const embeddings = new OllamaEmbeddings({
      model: embeddingModel,
      baseUrl: OLLAMA_BASE_URL,
    });

    // Test the Ollama connection before proceeding
    try {
      console.log("Testing Ollama connection...");
      await embeddings.embedQuery("test");
      console.log("Ollama connection successful");
    } catch (testError) {
      console.error("Ollama connection test failed:", testError);
      throw new Error(
        `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Ensure Ollama is running and the model '${embeddingModel}' is available.`
      );
    }

    // Initialize Chroma client (direct client, not LangChain wrapper)
    console.log(`Connecting to Chroma DB at ${CHROMA_URL}...`);
    const chromaUrl = new URL(CHROMA_URL);
    const client = new ChromaClient();

    // Get or create collection
    const collection = await client.getOrCreateCollection({
      name: storeId,
      metadata: { "hnsw:space": "cosine" },
    });

    console.log(`Storing ${chunks.length} chunks in Chroma DB...`);

    // Process in batches to avoid overwhelming Ollama
    const BATCH_SIZE = 50;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
      console.log(`Processing batch ${batchNum} of ${totalBatches}...`);

      // Generate embeddings for batch
      const texts = batch.map((doc) => doc.pageContent);
      const batchEmbeddings = await embeddings.embedDocuments(texts);

      // Prepare data for Chroma
      const ids = batch.map((_, idx) => `${storeId}-${processedChunks + idx}`);
      const metadatas = batch.map((doc) => ({
        source: doc.metadata.source || "unknown",
        page: doc.metadata.loc?.pageNumber?.toString() || "0",
      }));

      // Add to collection
      await collection.add({
        ids,
        embeddings: batchEmbeddings,
        documents: texts,
        metadatas: metadatas as Record<string, string | number>[],
      });

      processedChunks += batch.length;
      console.log(`Processed ${processedChunks}/${chunks.length} chunks`);
    }

    // Save metadata
    const metaData: StoreMetaData = {
      id: storeId,
      name: storeName,
      embeddingModel,
      fileCount: files.length,
      chunkCount: chunks.length,
      createdAt: new Date().toISOString(),
      status: "ready",
    };

    fs.writeFileSync(
      path.join(storeDir, "meta.json"),
      JSON.stringify(metaData, null, 2)
    );

    // Cleanup temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`Vector store created successfully: ${storeId}`);

    return NextResponse.json({
      success: true,
      data: metaData,
    });
  } catch (error) {
    console.error("Store creation error:", error);

    // Cleanup on error
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Clean up store directory if metadata wasn't saved
    if (storeDir && fs.existsSync(storeDir)) {
      const metaPath = path.join(storeDir, "meta.json");
      if (!fs.existsSync(metaPath)) {
        fs.rmSync(storeDir, { recursive: true, force: true });
      }
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: `Failed to create store: ${message}` },
      { status: 500 }
    );
  }
}