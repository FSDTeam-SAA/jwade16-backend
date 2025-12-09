export class Pagination {
  static calculatePagination(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
