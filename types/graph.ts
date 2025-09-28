// The Graph 查询类型定义
export interface Token {
  id: string
  name: string
  symbol: string
  creator: string
  createdAt: string
  uri: string
  mintTimes: string
}

export interface Transaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  timestamp: string
  blockNumber: string
}

export interface TokensResponse {
  tokens: Token[]
}

export interface TransactionsResponse {
  transactions: Transaction[]
}