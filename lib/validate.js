import {z} from "zod";

const name = z.string().trim();
const email = z.email({error: "Invalid Email ID"});
const role = z.enum();