"use server";

import { MongoClient, MongoServerError } from "mongodb";

interface SaveResult {
  success: boolean;
  insertedId?: string;
  error?: string;
}

const MONGODB_OPTIONS = {
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 10000,
  retryWrites: false
};

export async function saveBlogContent(
  url: string, 
  content: string
): Promise<SaveResult> {
  if (!url?.startsWith('http')) {
    return {
      success: false,
      error: "Invalid URL format"
    };
  }

  if (!content || content.trim().length === 0) {
    return {
      success: false,
      error: "Content cannot be empty"
    };
  }

  const client = new MongoClient(process.env.MONGODB_URI!, MONGODB_OPTIONS);
  
  try {
    await client.connect();
    const db = client.db('nexium-mongo');
    
    const timestamp = new Date();
    
    const result = await db.collection('blog_contents').insertOne({
      url: url.slice(0, 500), 
      content: content,
      createdAt: timestamp,
      _requestId: Date.now() 
    });

    const inserted = await db.collection('blog_contents').findOne({
      _id: result.insertedId
    });

    if (!inserted) {
      throw new Error("Document not found after insertion");
    }

    return {
      success: true,
      insertedId: result.insertedId.toString()
    };
  } catch (error: unknown) {
    console.error("MongoDB Save Error:", {
      error,
      url: url.slice(0, 50),
      contentLength: content.length
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed"
    };
  } finally {
    await client.close().catch(() => {});
  }
}