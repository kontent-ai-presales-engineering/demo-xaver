import axios from 'axios';
import KontentManagementService from '../../lib/services/kontent-management-service';
import { NextApiRequest, NextApiResponse } from 'next';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { figmaFileId } = req.body;
    const figmaToken = process.env.FIGMA_TOKEN;
    const kontentManagementApiKey = process.env.KONTENT_MANAGEMENT_API_KEY;

    // Fetch Figma file
    const figmaResponse = await axios.get(`https://api.figma.com/v1/files/${figmaFileId}`, {
      headers: {
        'X-Figma-Token': figmaToken
      }
    });

    const figmaData = figmaResponse.data;

    // Extract text from Figma file
    const textNodes = extractTextNodes(figmaData);
    // Import text into Kontent.ai
    const name = figmaData.name;
    await importTextToKontent(textNodes, name);

    res.status(200).json({ message: 'Text imported successfully' + textNodes.find(node => node.name === "title").text + textNodes.length + textNodes[1] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
}

function extractTextNodes(figmaData) {
  const textNodes = [];
  const traverse = (node) => {
    if (node.type === 'TEXT') {
      textNodes.push({ name: node.name, text: node.characters });
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  traverse(figmaData.document);
  return textNodes;
}

async function importTextToKontent(textNodes, name) {
  const kms = new KontentManagementService();
  await kms.createScreen(name, textNodes.find(node => node.name === "title").text, textNodes.find(node => node.name === "content").text)
}