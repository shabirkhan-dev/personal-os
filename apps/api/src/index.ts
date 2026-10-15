import { createApp } from "./app";

/** The Worker. Every request runs through the Hono app; config is parsed once per isolate. */
export default createApp();
