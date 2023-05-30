# TypeORM-Dynamic-Query
 TypeORM dynamic query Builder

## How To Use with TypeORM SelectQueryBuilder 

Use in Service: 
```javascript

constructor(@InjectRepository(TestList) private TestListRepository: Repository<TestList>) {}

async findRecord() {
    return this.TestListRepository.createQueryBuilder('test_list');
}

```

Use in Controller:
```javascript
import { DynamicQueryBuilder, IFilterable } from '../DynamicQueryBuilder';
constructor(private readonly testListService: TestListService) {}
@Post('list')
async getRecords(@Req() req, @Res() response: Response, @Body() body: any): Promise<any> {
    try {
        const filterable: IFilterable[] = [
            {
                field: 'testId',
                table: 'test_list',
                sort: true,
                filter: true,
            },
            {
                field: 'testName',
                table: 'test_list',
                sort: true,
                filter: true,
            },
            {
                field: 'testCode',
                table: 'test_list',
                sort: true,
                filter: true,
            }]

        const data = await this.testListService.findRecord();
        if (body) {
            await DynamicQueryBuilder(data, body, filterable);
        }

        let [item, total] = await data
            .select([
                'test_list.testId',
                'test_list.testCode',
                'test_list.testName'
             ]).getManyAndCount();
        return response.status(HttpStatus.OK).json({
            data: item,
            total: total,
        });
        
    } catch (e) {
        console.log(e);
        return response.status(e.status ? e.status : HttpStatus.BAD_REQUEST).json({
            status: 'fail',
            message: [e.code ? e.code : e.response],
        });
    }
}

```




## Request object:



```json

{
    "take": 10,
    "skip": 0,
    "sort": [
        {
            "field": "Id",
            "dir": "ASC"
        }
    ],
    "filter": {
        "logic": "and",
        "filters": [
            {
                "field": "test_name",
                "operator": "contains",
                "value": "ou"
            },      
            {
                "field": "test_code",
                "operator": "is",
                "value": "abcd"
            }      
        ]
    }
}

```

Generated sql Code looks like :

```sql

SELECT * FROM test_table WHERE (test_name like %ou% ) AND (test_code = 'abcd') ORDER BY Id ASC  LIMIT 10

```

## Support Nested Query:

```json

{
    "take": 10,
    "skip": 0,
    "sort": [
        {
            "field": "Id",
            "dir": "ASC"
        }
    ],
    "filter": {
        "logic": "and",
        "filters": [
            {
                "field": "test_name",
                "operator": "contains",
                "value": "ou"
            },      
            {
                "logic": "or",
                "filters": [
                    {
                        "field": "testCode",
                        "operator": "contains",
                        "value": "ol"
                    },
                    {
                        "field": "sampleType",
                        "operator": "is",
                        "value": "Blood"
                    }
                ]
            }     
        ]
    }
}

```

Generated sql Code looks like :

```sql

SELECT * FROM test_table WHERE (test_name like %ou% ) AND ((test_code LIKE %ol%) OR (sample_type = 'Blood')) ORDER BY Id ASC  LIMIT 10

```

## Examples of Requested Objects:

### Example -1

```json

{
    "take": 10,
    "skip": 0,

}

```

### Example -2

```json

{
    "take": 10,
    "skip": 0,
    "sort": [
        {
            "field": "Id",
            "dir": "ASC"
        }
    ],

}

```

### Example -3

```json

{
    "sort": [
        {
            "field": "Id",
            "dir": "ASC"
        }
    ],

}

```

### Example -4

```json

{
    "filter": {
        "logic": "and",
        "filters": [
            {
                "field": "test_name",
                "operator": "contains",
                "value": "ou"
            }    
        ]
    }

}

```




## Supported Operators: 


```javascript
const Operators =  {
  is?: string; // =
  not?: string; // !=
  in?: string; // IN
  not_in?: string; // NOT IN
  lt?: string; // <
  lte?: string; // <=
  gt?: string; // >
  gte?: string;  // >=
  contains?: string; // LIKE %value%
  not_contains?: string; // NOT LIKE %value%
  starts_with?: string;  // LIKE value%
  not_starts_with?: string; // NOT LIKE value%
  ends_with?: string; // LIKE %value
  not_ends_with?: string; // NOT LIKE %value
}

```
