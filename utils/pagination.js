function parsePagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100)
  const skip = (page - 1) * limit

  return {
    page,
    limit,
    skip
  }
}

function buildPageMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  }
}

module.exports = {
  parsePagination,
  buildPageMeta
}
