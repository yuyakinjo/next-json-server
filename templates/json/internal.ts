import { isNotEmpty } from "ramda";

/**
 * 値がゼロかどうかを判定する
 * @param value 判定する数値
 * @returns 値がゼロの場合はtrue、それ以外の場合はfalse
 */
export const isZero = (value: number) => value === 0;

/**
 * 値が数値かどうかを判定する
 * @param value 判定する値
 * @returns 値が数値の場合はtrue、それ以外の場合はfalse
 */
export const isNumber = (value: unknown) => {
  return typeof value === "number";
};

/**
 * 指定されたプレフィックスで始まるパラメータキーかどうかを判定し、
 * 一致する場合はプレフィックスを除いたフィールド名を返す
 * @param paramKey パラメータキー
 * @param prefix プレフィックス
 * @returns プレフィックスが一致する場合はプレフィックスを除いたフィールド名、一致しない場合はnull
 */
export const getFieldIfPrefixMatches = (paramKey: string, prefix: string) => {
  if (paramKey.startsWith(`${prefix}_`)) {
    return paramKey.replace(`${prefix}_`, "");
  }
  return null;
};

/**
 * 検索パラメータに基づいてデータをフィルタリングする関数
 * @param jsonBody フィルタリング対象のJSONデータ
 * @param searchParams 検索パラメータ
 * @returns フィルタリングされたデータの配列
 */
export function filterDataBySearchParams(
  jsonBody: Record<string, unknown>,
  searchParams: URLSearchParams,
): unknown[] {
  return Object.entries(jsonBody)
    .filter(([key, value]) => {
      const val = value as Record<string, string | number>; // 型を明示的に指定
      return Array.from(searchParams.entries()).every(
        ([paramKey, paramValue]) => {
          // 各プレフィックスに対するフィールド名を取得
          const gtField = getFieldIfPrefixMatches(paramKey, "gt");
          const ltField = getFieldIfPrefixMatches(paramKey, "lt");
          const gteField = getFieldIfPrefixMatches(paramKey, "gte");
          const lteField = getFieldIfPrefixMatches(paramKey, "lte");
          const neField = getFieldIfPrefixMatches(paramKey, "ne");
          const inField = getFieldIfPrefixMatches(paramKey, "in");

          if (gtField && isNumber(val[gtField])) {
            return Number(val[gtField]) > Number(paramValue);
          }
          if (ltField && isNumber(val[ltField])) {
            return Number(val[ltField]) < Number(paramValue);
          }
          if (gteField && isNumber(val[gteField])) {
            return Number(val[gteField]) >= Number(paramValue);
          }
          if (lteField && isNumber(val[lteField])) {
            return Number(val[lteField]) <= Number(paramValue);
          }
          if (neField && isNumber(val[neField])) {
            return Number(val[neField]) !== Number(paramValue);
          }
          if (inField && isNumber(val[inField])) {
            return paramValue
              .split(",")
              .filter(isNotEmpty)
              .includes(`${val[inField]}`);
          }
          // 重複したクエリパラメータを配列として取得し、includesを使用してフィルタリング
          // ?id=1&id=2 のようなクエリパラメータをフィルタリングする
          const allValues = searchParams.getAll(paramKey);
          return allValues.includes(`${val[paramKey]}`);
        },
      );
    })
    .map(([key, value]) => value); // フィルタリングされたデータを配列として返す
}
