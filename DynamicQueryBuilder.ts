import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
interface FieldOptions {
  is?: string;
  not?: string;
  in?: string;
  not_in?: string;
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  contains?: string;
  not_contains?: string;
  starts_with?: string;
  not_starts_with?: string;
  ends_with?: string;
  not_ends_with?: string;
}

export const DynamicQueryBuilder = <T>(query: SelectQueryBuilder<T>, tableName: string, params: any) => {
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
    if (keys.indexOf('sort') >= 0) {
      generateSortQuery(query, params.sort, tableName);
    }

    if (keys.indexOf('filter') >= 0) {
      const key2 = Object.keys(params.filter);
      if (key2.length == 2) {
        const all = [];
        traverseTree(query, all, params.filter, tableName);
      }
    }
  } else {
    console.log('No Body');
  }

  return query.take(take).skip(skip);
};

const generateSortQuery = <T>(query: SelectQueryBuilder<T>, params = [], tableName = '') => {
  params.forEach((e, i) => {
    const keys = Object.keys(e);
    let field = '';
    let dir = 'asc';

    if (keys.length > 0) {
      if (keys.indexOf('field') >= 0) {
        field = tableName + '.' + e.field;
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

const traverseTree = async (query: WhereExpressionBuilder, all: any, filter: any, tableName: string, Operator = '') => {
  if (filter.filters) {
    let logic = 'AND';

    if (filter.logic == 'or') {
      logic = 'OR';
    }

    const filters = filter.filters;
    let index = 0;
    for (index = 0; index < filters.length; index++) {
      if (logic === 'AND') {
        query = query.andWhere(buildNewBrackets(all, filters[index], tableName, 'AND'));
      } else {
        query = query.orWhere(buildNewBrackets(all, filters[index], tableName, 'OR'));
      }
    }
  } else {
    query = generateWhereQuery(query, filter, tableName, Operator === 'AND' ? 'andWhere' : 'orWhere');

    // console.debug(query);

    all.push(filter);
  }

  return JSON.stringify(all);
};

const buildNewBrackets = (all: any, filter: any, tableName: string, logic: string) => {
  return new Brackets(async (qb) => {
    traverseTree(qb, all, filter, tableName, logic);
  });
};

const generateWhereQuery = (query: WhereExpressionBuilder, fields: any, tableName: string, andOr: 'andWhere' | 'orWhere') => {
  const fieldName = tableName + '.' + fields.field;
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
      query[andOr](`${fieldName} >= :${param}`, { gtevalue: value });
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
  let i = 0;
  let key = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let charactersLength = characters.length;

  for (i = 0; i < keyLength; i++) {
    key += characters.substr(Math.floor(Math.random() * charactersLength + 1), 1);
  }

  return key;
};
