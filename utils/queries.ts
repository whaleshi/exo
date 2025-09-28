import { gql } from "graphql-request";
import { fetchGraphQL } from "./graphql";
import { TokensResponse, TransactionsResponse, Token, Transaction } from "../types/graph";

// 获取所有代币 - 简化版本，只查询确定存在的字段
export const GET_TOKENS = gql`
    query GetTokens($first: Int = 100, $skip: Int = 0, $orderBy: String = "createdAt", $orderDirection: String = "desc") {
        tokens(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
            id
            name
            symbol
            creator
            createdAt
            uri
            mintTimes
        }
    }
`;

// 获取特定代币信息
export const GET_TOKEN = gql`
    query GetToken($id: String!) {
        token(id: $id) {
            id
            name
            symbol
            creator
            createdAt
            uri
            mintTimes
        }
    }
`;

// 获取交易记录
export const GET_TRANSACTIONS = gql`
    query GetTransactions($first: Int = 100, $skip: Int = 0) {
        transactions(first: $first, skip: $skip, orderBy: "timestamp", orderDirection: "desc") {
            id
            hash
            from
            to
            value
            timestamp
            blockNumber
        }
    }
`;

// 查询函数
export const getTokens = async (variables?: {
    first?: number;
    skip?: number;
    orderBy?: string;
    orderDirection?: string;
}): Promise<Token[]> => {
    const data = await fetchGraphQL<TokensResponse>(GET_TOKENS, variables);
    return data.tokens;
};

export const getToken = async (id: string): Promise<Token | null> => {
    const data = await fetchGraphQL<{ token: Token | null }>(GET_TOKEN, { id });
    return data.token;
};

export const getTransactions = async (variables?: { first?: number; skip?: number }): Promise<Transaction[]> => {
    const data = await fetchGraphQL<TransactionsResponse>(GET_TRANSACTIONS, variables);
    return data.transactions;
};
