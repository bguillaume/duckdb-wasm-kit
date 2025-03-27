type AsyncFunction<T> = () => Promise<T>;
interface UseAsyncResult<T> {
    loading: boolean;
    error: Error | undefined;
    data: T | undefined;
}
declare function useAsync<T>(fn: AsyncFunction<T>, deps?: any[]): UseAsyncResult<T>;
export default useAsync;
