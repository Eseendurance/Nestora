export async function readJsonBody(request:Request):Promise<unknown>{
  try{
    return await request.json();
  }catch(error){
    if(error instanceof SyntaxError)return null;
    throw error;
  }
}
