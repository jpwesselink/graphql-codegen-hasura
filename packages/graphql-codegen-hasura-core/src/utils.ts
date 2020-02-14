import { defaultDataIdFromObject } from "@apollo/client";

// Optimistic response generation utility method
//
export function generateOptimisticResponseForMutation<T>({
  operationType,
  entityName,
  objects
}: {
  operationType: "update" | "insert" | "delete";
  entityName: string;
  objects: { id: any }[];
}): T {
  const optimisticResponse = ({
    __typename: "mutation_root",
    [`${operationType}_${entityName}`]: {
      affected_rows: objects.length,
      returning: objects.map(entity => {
        return { ...entity, __typename: entityName };
      }),
      __typename: `\${entityName}_mutation_response`
    }
  } as unknown) as T;

  return optimisticResponse;
}

/**
 *
 * @param param0
 */
export function generateUpdateFunctionForMutation<T>({ operationType, entityName, entityId }: { operationType: "delete"; entityName: string; entityId: string | number }) {
  return (cache: any, result: any) => {
    cache.evict(defaultDataIdFromObject({ __typename: entityName, id: entityId }));
  };
}

export function IS_JAVASCRIPT_SCALAR_EQUIVALENT(arg: any, includeNull: boolean = false) {
  var type = typeof arg;
  return (includeNull && arg === null) || (type != "object" && type != "function");
}

export function IS_APOLLO_OBJECT(o: any) {
  return o && o.id && o.__typename;
}

export function convertApolloObjectToRefObj(o: any) {
  if (!IS_APOLLO_OBJECT(o)) throw new Error(`Provided object was not of type ApolloObject (with id & _typename properties): ${JSON.stringify(o)}`);
  return { id: o.id, __typename: o.__typeName };
}

export function convertApolloObjectArrayToRefObj(o: any[]) {
  return o.map(arrayItem => convertApolloObjectToRefObj(o));
}

export function convertInsertInputToShallowPartialFragment(insertInputObject: object) {
  const fragment: any = {};

  // Loop object and build up a fragment appropriate for a cache-add
  for (const [insertInputKey, insertInputValue] of Object.entries(insertInputObject)) {
    //Add scalar values
    if (IS_JAVASCRIPT_SCALAR_EQUIVALENT(insertInputValue)) {
      fragment[insertInputKey] = insertInputValue;
      continue;
    }

    //Add id and type for referenced objects
    if (IS_APOLLO_OBJECT(insertInputValue)) {
      fragment[insertInputKey] = convertApolloObjectToRefObj(insertInputValue);
      continue;
    }

    //Add id and type for referenced objects arrays
    if (Array.isArray(insertInputValue)) {
      const innerArray: any[] = [];
      for (const arrayVal of insertInputValue) {
        if (IS_APOLLO_OBJECT(arrayVal)) {
          innerArray.push(convertApolloObjectToRefObj(arrayVal));
        }
      }
      if (innerArray.length > 0) {
        fragment[insertInputKey] = innerArray;
      }
      continue;
    }
  }
  return fragment;
}
