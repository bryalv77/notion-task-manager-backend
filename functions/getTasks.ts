import { Handler } from "@netlify/functions";
import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const notionApiBaseUrl = process.env.NOTION_API_BASE_URL || "";
const notionDatabaseId = process.env.NOTION_DATABASE_ID || "";
const notionToken = process.env.NOTION_TOKEN || "";

const getTasks: Handler = async (event, context) => {
  try {
    // Authenticate user
    const isAuthenticated = await authenticateUser(
      event.headers["authorization"] || ""
    );
    if (!isAuthenticated) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    switch (event.httpMethod) {
      case "GET":
        return await fetchTasks();
      case "POST":
        return await addTask(JSON.parse(event.body || "{}"));
      case "DELETE":
        return await removeTask(JSON.parse(event.body || "{}"));
      case "PUT":
        return await updateTask(JSON.parse(event.body || "{}"));
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

// Function to authenticate the user
const authenticateUser = async (authHeader: string): Promise<boolean> => {
  const [scheme, credentials] = authHeader.split(" ");
  if (scheme !== "Basic" || !credentials) {
    return false;
  }

  const [username, password] = Buffer.from(credentials, "base64")
    .toString()
    .split(":");
  if (!username || !password) {
    return false;
  }

  const users = require("./users.json");
  return users[username] === password;
};

const fetchTasks = async () => {
  try {
    const response = await axios.post(
      `${notionApiBaseUrl}/databases/${notionDatabaseId}/query`,
      {},
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching tasks" }),
    };
  }
};

const addTask = async (taskData: any) => {
  try {
    const response = await axios.post(
      `${notionApiBaseUrl}/pages`,
      {
        parent: { database_id: notionDatabaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: taskData.title,
                },
              },
            ],
          },
          // Agrega otras propiedades según tu base de datos de Notion
        },
      },
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );
    return {
      statusCode: 201,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error adding task:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error adding task" }),
    };
  }
};

const removeTask = async (taskData: any) => {
  try {
    const response = await axios.patch(
      `${notionApiBaseUrl}/pages/${taskData.id}`,
      {
        archived: true,
      },
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error removing task:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error removing task" }),
    };
  }
};

const updateTask = async (taskData: any) => {
  try {
    const response = await axios.patch(
      `${notionApiBaseUrl}/pages/${taskData.id}`,
      {
        properties: {
          title: {
            title: [
              {
                text: {
                  content: taskData.title,
                },
              },
            ],
          },
          // Actualiza otras propiedades según tu base de datos de Notion
        },
      },
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error updating task" }),
    };
  }
};

export { getTasks };
