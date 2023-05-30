import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
export interface IFilterable {
  field: string;
  table: string;
  sort: boolean;
  filter: boolean;
}

export const DynamicQueryBuilder = async <T>(query: SelectQueryBuilder<T>, params: any, filterable?: IFilterable[]) => {
  const keys = Object.keys(params);
  let take = 0;
  let skip = 0;

  if (keys.length > 0) {
    if (keys.indexOf('take') >= 0) {
      take = params.take;
    }
    if (keys.indexOf('skip') >= 0) {
      skip = params.skip;
    }

    if (filterable) {
      if (filterable.length > 0) {
        filterable.forEach((item) => {
          if (params.filter) {
            if (item.filter) {
              deepSearch(params.filter, 'field', item.field, item.table);
            }
          }
          if (params.sort) {
            if (item.sort) {
              deepSearch(params.sort, 'field', item.field, item.table);
            }
          }
        });
      }
    }

    if (keys.indexOf('sort') >= 0) {
      generateSortQuery(query, params.sort);
    }

    if (keys.indexOf('filter') >= 0) {
      const key2 = Object.keys(params.filter);

      if (key2.length == 2) {
        const all = [];
        await traverseTree(query, all, params.filter);
      }
    }
  } else {
    // console.log('No Body');
  }

  return query.take(take).skip(skip);
};

const generateSortQuery = <T>(query: SelectQueryBuilder<T>, params = []) => {
  params.forEach((e, i) => {
    const keys = Object.keys(e);
    let field = '';
    let dir = 'asc';

    if (keys.length > 0) {
      if (keys.indexOf('field') >= 0) {
        if (e.field.includes('.')) {
          field = e.field;
        } else {
          field = 'substance_list.' + e.field;
        }
      }
      if (keys.indexOf('dir') >= 0) {
        dir = e.dir;
      }
    }

    if (field !== '') {
      if (i === 0) {
        if (dir === 'asc' || dir === 'ASC') {
          query.orderBy(field, 'ASC');
        } else {
          query.orderBy(field, 'DESC');
        }
      } else {
        if (dir === 'asc' || dir === 'ASC') {
          query.addOrderBy(field, 'ASC');
        } else {
          query.addOrderBy(field, 'DESC');
        }
      }
    }
  });
};

const traverseTree = async (query: WhereExpressionBuilder, all: any, filter: any, Operator = '') => {
  if (!filter.filters) {
    generateWhereQuery(query, filter, Operator === 'AND' ? 'andWhere' : 'orWhere');
    all.push(filter);
  } else {
    let logic = 'AND';

    if (filter.logic == 'or') {
      logic = 'OR';
    }

    const filters = filter.filters;
    let index: number;
    for (index = 0; index < filters.length; index++) {
      if (logic === 'AND') {
        query = query.andWhere(buildNewBrackets(all, filters[index], 'AND'));
      } else {
        query = query.orWhere(buildNewBrackets(all, filters[index], 'OR'));
      }
    }
  }

  return JSON.stringify(all);
};

const buildNewBrackets = (all: any, filter: any, logic: string) => {
  return new Brackets(async (qb) => {
    await traverseTree(qb, all, filter, logic);
  });
};

const generateWhereQuery = (query: WhereExpressionBuilder, fields: any, andOr: 'andWhere' | 'orWhere') => {
  let fieldName: string;
  if (fields.field.includes('.')) {
    fieldName = fields.field;
  } else {
    fieldName = fields.field;
  }

  const value = fields.value;
  const operation = fields.operator;

  const d = new Date();
  let time = d.getTime();

  const param = randomString(5) + time + randomString(5);

  switch (operation) {
    case 'is': {
      query[andOr](`${fieldName} = :${param}`, { [param]: value });
      break;
    }
    case 'not': {
      query[andOr](`${fieldName} != :${param}`, { [param]: value });
      break;
    }
    case 'in': {
      query[andOr](`${fieldName} IN :${param}`, { [param]: value });
      break;
    }
    case 'not_in': {
      query[andOr](`${fieldName} NOT IN :${param}`, { [param]: value });
      break;
    }
    case 'lt': {
      query[andOr](`${fieldName} < :${param}`, { [param]: value });
      break;
    }
    case 'lte': {
      query[andOr](`${fieldName} <= :${param}`, { [param]: value });
      break;
    }
    case 'gt': {
      query[andOr](`${fieldName} > :${param}`, { [param]: value });
      break;
    }
    case 'gte': {
      query[andOr](`${fieldName} >= :${param}`, { [param]: value });
      break;
    }
    case 'contains': {
      query[andOr](`${fieldName} LIKE :${param}`, { [param]: `%${value}%` });
      break;
    }
    case 'not_contains': {
      query[andOr](`${fieldName} NOT LIKE :${param}`, { [param]: `%${value}%` });
      break;
    }
    case 'starts_with': {
      query[andOr](`${fieldName} LIKE :${param}`, { [param]: `${value}%` });
      break;
    }
    case 'not_starts_with': {
      query[andOr](`${fieldName} NOT LIKE :${param}`, { [param]: `${value}%` });
      break;
    }
    case 'ends_with': {
      query[andOr](`${fieldName} LIKE :${param}`, { [param]: `%${value}` });
      break;
    }
    case 'not_ends_with': {
      query[andOr](`${fieldName} LIKE :${param}`, { [param]: `%${value}` });
      break;
    }
    default: {
      break;
    }
  }

  return query;
};

const randomString = (keyLength: number) => {
  let i: number;
  let key = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let charactersLength = characters.length;

  for (i = 0; i < keyLength; i++) {
    key += characters.substr(Math.floor(Math.random() * charactersLength + 1), 1);
  }

  return key;
};

const deepSearch = (obj: any, key: string, value: string, tableName: string) => {
  // console.log(obj)
  // Base case
  if (obj[key] === value) {
    return obj;
  } else {
    const keys = Object.keys(obj); // add this line to iterate over the keys

    for (let i = 0, len = keys.length; i < len; i++) {
      const k = keys[i]; // use this key for iteration, instead of index "i"

      // add "obj[k] &&" to ignore null values
      if (obj[k] && typeof obj[k] == 'object') {
        const found = deepSearch(obj[k], key, value, tableName);
        if (found) {
          if (found['field']) {
            found['field'] = tableName + '.' + found['field']; // replace field name

            return obj;
          }
        }
      }
    }
  }
};

