import { NextResponse } from 'next/server';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';

// Define files/directories to exclude from the zip
const excludedPaths = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  'prisma/migrations',
  // Add any other files/directories to exclude
  // e.g., 'dist', 'build', '*.log'
];

// Function to check if a path should be excluded
const isExcluded = (filePath: string, projectRoot: string): boolean => {
  const relativePath = path.relative(projectRoot, filePath);
  return excludedPaths.some(excluded => {
    // Check for exact match or if it's a directory prefix
    if (relativePath === excluded || relativePath.startsWith(excluded + path.sep)) {
      return true;
    }
    // Check for .env files specifically
    if (excluded === '.env' && path.basename(relativePath).startsWith('.env')) {
      return true;
    }
    // Add more complex glob patterns if needed
    return false;
  });
};

export async function GET() {
  const projectRoot = process.cwd(); // Gets the root directory (/Users/mertk/Documents/GitHub/InstantCoder-main)
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // Use PassThrough stream to pipe the archive data
  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  // Handle archive errors
  archive.on('error', (err) => {
    console.error('Archive creation error:', err);
    // Cannot send response here as headers might already be sent
  });

  // Add files to the archive, excluding specified paths
  archive.glob('**/*', {
    cwd: projectRoot,
    ignore: excludedPaths, // Use archiver's built-in ignore
    dot: true, // Include dotfiles unless explicitly excluded
  });

  // Finalize the archive asynchronously
  archive.finalize().catch(err => {
    console.error('Error finalizing archive:', err);
    // Handle finalization error if needed, though response might be sent
  });

  // Return the stream as the response
  return new NextResponse(passThrough as any, { // Cast needed for type compatibility
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="instantcoder-project.zip"',
    },
  });
}
