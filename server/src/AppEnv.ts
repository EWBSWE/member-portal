
export enum AppEnv {
    DEVELOPMENT,
    TEST,
    PRODUCTION
}

export function deserialize(env: string): AppEnv {
    if (env === "development") return AppEnv.DEVELOPMENT
    if (env === "test") return AppEnv.TEST
    if (env === "production") return AppEnv.PRODUCTION
    throw new Error(`Unknown app env ${env}`)
}
