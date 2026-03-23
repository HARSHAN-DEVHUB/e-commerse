const { parsePagination, buildPageMeta } = require('../../utils/pagination')

describe('pagination utils', () => {
  it('parses pagination with defaults', () => {
    const page = parsePagination({})
    expect(page).toEqual({ page: 1, limit: 10, skip: 0 })
  })

  it('clamps invalid values', () => {
    const page = parsePagination({ page: '-5', limit: '1000' })
    expect(page).toEqual({ page: 1, limit: 100, skip: 0 })
  })

  it('builds page metadata', () => {
    expect(buildPageMeta(2, 10, 35)).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      totalPages: 4
    })
  })
})
