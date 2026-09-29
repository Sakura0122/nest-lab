export class PageRequest {
  currentPage = 1
  pageSize = 20
  keyword?: string
  sortField?: string
  isAsc = true

  get offset(): number {
    return (this.currentPage - 1) * this.pageSize
  }
}

export class PageResult<T> {
  constructor(
    readonly total: number,
    readonly pageCount: number,
    readonly list: T[],
  ) {}

  static of<T>(page: PageRequest, total: number, items: T[]): PageResult<T> {
    return new PageResult(total, Math.ceil(total / page.pageSize), items)
  }
}
