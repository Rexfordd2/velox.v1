const mockData = {
  data: null,
  error: null,
};

const mockStorageFrom = jest.fn().mockReturnValue({
  upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({
    data: { publicUrl: "https://mock.cdn/avatar.jpg" },
  }),
});

const mockSelect = jest.fn().mockImplementation(function() {
  this.query = { type: 'select', columns: arguments[0] || '*' };
  return this;
});

const mockEq = jest.fn().mockImplementation(function(column, value) {
  if (!this.query.filters) this.query.filters = [];
  this.query.filters.push({ type: 'eq', column, value });
  return this;
});

const mockOrder = jest.fn().mockImplementation(function(column, options) {
  this.query.order = { column, ...options };
  return this;
});

const mockSingle = jest.fn().mockImplementation(function() {
  return mockData;
});

const mockInsert = jest.fn().mockImplementation(function(data) {
  this.query = { type: 'insert', data };
  return this;
});

class QueryBuilder {
  constructor() {
    this.query = {};
  }

  select() { return mockSelect.apply(this, arguments); }
  eq() { return mockEq.apply(this, arguments); }
  order() { return mockOrder.apply(this, arguments); }
  single() { return mockSingle.apply(this, arguments); }
  insert() { return mockInsert.apply(this, arguments); }
  update() { return this; }
  delete() { return this; }
  upsert() { return this; }
  match() { return this; }
  neq() { return this; }
  gt() { return this; }
  lt() { return this; }
  gte() { return this; }
  lte() { return this; }
  like() { return this; }
  ilike() { return this; }
  is() { return this; }
  in() { return this; }
  contains() { return this; }
  containedBy() { return this; }
  range() { return this; }
  textSearch() { return this; }
  filter() { return this; }
  not() { return this; }
  or() { return this; }
  and() { return this; }
}

const mockFrom = jest.fn().mockImplementation(() => new QueryBuilder());

module.exports = {
  createClient: () => ({
    storage: {
      from: mockStorageFrom,
    },
    from: mockFrom,
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'mock-user-id'
            }
          }
        },
        error: null
      })
    }
  }),
}; 