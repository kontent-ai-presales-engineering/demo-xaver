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
    const webhook = req.body as WebhookNotifications;
    const isValidRequest = webhook.notifications && webhook.notifications[0].message && webhook.notifications[0].message.action && webhook.notifications[0].message.action === "workflow_step_changed"

    if (!isValidRequest) {
      res.status(200).end()
      return
    }

    await webhook.notifications.forEach(async notification => {
      const figmaFileName = notification.data.system.name
      // const figmaToken = process.env.FIGMA_TOKEN;

      // // Fetch Figma file
      // const figmaResponse = await axios.get(`https://api.figma.com/v1/files/${figmaFileId}`, {
      //   headers: {
      //     'X-Figma-Token': figmaToken
      //   }
      // });

      getFigmaFileByName(figmaFileName).then(async figmaResponse => {

        const figmaData = figmaResponse.data;

        // Extract text from Figma file
        const textNodes = extractTextNodes(figmaData);
        // Import text into Kontent.ai
        const name = figmaData.name;

        await importTextToKontent(textNodes, name);

        res.status(200).json({ message: 'Text imported successfully' });
      })

    })
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
}

async function getFigmaFileByName(fileName) {
  const figmaToken = process.env.FIGMA_TOKEN;
  const teamId = process.env.FIGMA_TEAM_ID; // Set your Figma Team ID as an env variable

  try {
    // Step 1: Get all projects under the team
    const projectsResponse = await axios.get(`https://api.figma.com/v1/teams/${teamId}/projects`, {
      headers: { 'X-Figma-Token': figmaToken }
    });

    const projects = projectsResponse.data.projects;
    if (!projects.length) {
      console.log('No projects found.');
      return null;
    }

    // Step 2: Search through each project for files
    for (const project of projects) {
      const projectId = project.id;

      const filesResponse = await axios.get(`https://api.figma.com/v1/projects/${projectId}/files`, {
        headers: { 'X-Figma-Token': figmaToken }
      });

      const file = filesResponse.data.files.find(f => f.name === fileName);
      if (file) {
        console.log(`Found file: ${file.name}, ID: ${file.key}`);

        // Step 3: Fetch the file using the ID
        const figmaResponse = await axios.get(`https://api.figma.com/v1/files/${file.key}`, {
          headers: { 'X-Figma-Token': figmaToken }
        });

        return figmaResponse.data;
      }
    }

    console.log('File not found.');
    return null;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    return null;
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
  console.log('Importing text to Kontent.ai', textNodes);
  const kms = new KontentManagementService();
  await kms.createScreen(name, textNodes.find(node => node.name === "☁️ title").text, textNodes.find(node => node.name === "content").text)
}

export interface WorkflowEventItem {
  id: string;
  name: string;
  codename: string;
  collection: string;
  workflow: string;
  workflow_step: string;
  language: string;
  type: string;
  last_modified: string;
}

export interface Data {
  system: WorkflowEventItem;
}

export interface Message {
  environment_id: string;
  object_type: string;
  action: string;
  delivery_slot: string;
}

export interface WebhookNotification {
  data: Data;
  message: Message;
}

export interface WebhookNotifications {
  notifications: WebhookNotification[];
}