import 'mysql2';

declare module 'mysql2' {
  interface QueryResult {
    [key: string]: any;
    length: number;
    [index: number]: any;
  }

  interface QueryFunction<T = any> {
    (
      sql: string,
      values?: any | any[] | { [param: string]: any },
      callback?: (
        err: QueryError | null,
        results: T,
        fields: FieldPacket[]
      ) => any
    ): Query;
  }

  interface PoolConnection {
    query: QueryFunction;
  }
}
