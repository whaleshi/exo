import { GraphQLClient } from "graphql-request";

// 替换为你的 subgraph 端点
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/119463/bro/v0.0.5";

export const graphQLClient = new GraphQLClient(SUBGRAPH_URL);

// 通用查询函数
export const fetchGraphQL = async <T>(query: string, variables?: any): Promise<T> => {
    try {
        const data = await graphQLClient.request<T>(query, variables);
        return data;
    } catch (error) {
        console.error("GraphQL query error:", error);
        throw error;
    }
};
