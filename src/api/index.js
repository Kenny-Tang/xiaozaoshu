// api/index.js
import * as user from './modules/user';
import * as blog from './modules/blog';
import * as staticRequest from "@/utils/staticRequest.js";

export default {
    user,
    blog,
    staticRequest,
};