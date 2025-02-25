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
