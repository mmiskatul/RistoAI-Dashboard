export type PaginationItem = number | "...";

export const buildPaginationItems = (totalPages: number, currentPage: number): PaginationItem[] => {
  const items: PaginationItem[] = [];

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) {
      items.push(page);
    }
    return items;
  }

  items.push(1);
  if (currentPage > 3) items.push("...");

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) items.push("...");
  items.push(totalPages);

  return items;
};
