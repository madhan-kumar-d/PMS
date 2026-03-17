import prisma from "@/lib/db"
export async function POST(req){
    // const body = await req.json();
    // console.log(req);
    // const {name, email, password, confirmPassword, role} = 
    return Response.json({
        message: "first route is success",
    }, {
        status: 200
    })
}