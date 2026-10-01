// ကိုယ်တိုင် ရည်ရွယ်ပြီး throw လုပ်တဲ့ error အတွက်ပါ။ ဥပမာ user မတွေ့ရင်၊ permission မရှိရင်လို "ဖြစ်နိုင်မှန်း ကြိုသိထားတဲ့" error တွေပါ
// Services throw this instead of touching `res`, and shared/middleware/errorHandler.ts turns it into
// the HTTP response. That's what lets a service stay unaware it's even running inside Express.
export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}
