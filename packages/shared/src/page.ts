export interface PageRequest {
  currentPage?: number
  pageSize?: number
  keyword?: string
  sortField?: string
  isAsc?: boolean
}

export interface PageResponse<T> {
  total: number
  pageCount: number
  list: T[]
}
