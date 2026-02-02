import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";

/* ------------------------------------------------------------------ */
/* CONFIG                                                             */
/* ------------------------------------------------------------------ */

const BASE_URL = "https://api.haloscan.com/api";

/* ------------------------------------------------------------------ */
/* HALOSCAN REQUEST HELPER                                            */
/* ------------------------------------------------------------------ */

async function makeHaloscanRequest(
  endpoint: string,
  params: Record<string, any> | undefined,
  method: "GET" | "POST"
): Promise<any> {

  const apiKey = process.env.HALOSCAN_API_KEY;

  if (!apiKey) {
    throw new Error("HALOSCAN_API_KEY is not set");
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    if (method === "GET") {
      return (
        await axios.get(url, {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "haloscan-api-key": apiKey,
          }
        })
      ).data;
    }

    return (
      await axios.post(url, params ?? {}, {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "haloscan-api-key": apiKey,
        }
      })
    ).data;

  } catch (error: any) {
    console.error(
      "Haloscan API error:",
      error?.response?.status,
      error?.response?.data
    );
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* ZOD SCHEMAS (UNCHANGED)                                            */
/* ------------------------------------------------------------------ */

const ToolsParams = z.object({
  lineCount: z.number().optional(),
  order_by: z.string().optional(),
  order: z.string().optional(),
  volume_min: z.number().optional(),
  volume_max: z.number().optional(),
  cpc_min: z.number().optional(),
  cpc_max: z.number().optional(),
  competition_min: z.number().optional(),
  competition_max: z.number().optional(),
  kgr_min: z.number().optional(),
  kgr_max: z.number().optional(),
  kvi_min: z.number().optional(),
  kvi_max: z.number().optional(),
  kvi_keep_na: z.boolean().optional(),
  allintitle_min: z.number().optional(),
  allintitle_max: z.number().optional(),
  word_count_min: z.number().optional(),
  word_count_max: z.number().optional(),
  include: z.string().optional(),
  exclude: z.string().optional(),
});

const getKeywordsOverview = z.object({
  keyword: z.string(),
  requested_data: z.array(z.string()).default([
    "keyword_match",
    "related_search",
    "related_question",
    "similar_category",
    "similar_serp",
    "top_sites",
    "similar_highlight",
    "categories",
    "synonyms",
    "metrics",
    "volume_history",
    "serp",
  ]),
  lang: z.string().optional(),
});

const getKeywordsMatch = ToolsParams.extend({
  keyword: z.string(),
  exact_match: z.boolean().optional(),
});

type KeywordsParams = z.infer<typeof getKeywordsMatch>;

/* ------------------------------------------------------------------ */
/* MCP CONFIG                                                         */
/* ------------------------------------------------------------------ */

export function configureHaloscanServer(server: McpServer) {

  /* -------------------- USER CREDIT -------------------- */
  server.tool("get_user_credit", "Obtenir les crédits Haloscan.", async () => {
    try {
      const data = await makeHaloscanRequest("/user/credit", undefined, "GET");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error getting user credits: ${error.message}`,
        }],
      };
    }
  });

  /* -------------------- KEYWORDS OVERVIEW -------------------- */
  server.tool(
    "get_keywords_overview",
    "Obtenir un aperçu des mots-clés.",
    getKeywordsOverview.shape,
    async (params) => {
      try {
        const data = await makeHaloscanRequest(
          "/keywords/overview",
          params,
          "POST"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: error.message }],
        };
      }
    }
  );

  /* -------------------- KEYWORDS MATCH -------------------- */
  server.tool(
    "get_keywords_match",
    "Obtenir la correspondance des mots-clés.",
    getKeywordsMatch.shape,
    async (params: KeywordsParams) => {
      try {
        const data = await makeHaloscanRequest(
          "/keywords/match",
          params,
          "POST"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: error.message }],
        };
      }
    }
  );

}
