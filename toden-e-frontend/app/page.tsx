// app/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

const FormSchema = z.object({
  username: z.string().min(7, {
    message: "Username must be at least 7 characters.",
  }).max(50),
  password: z.string().min(10, {
    message: "Username must be at least  characters.",
  }).max(50),
});

export default function RootPage() {
  const router = useRouter();
  
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    }
  });

  function tryLogin(data: z.infer<typeof FormSchema>) {
    console.log(data)
    form.reset();
    router.push('/home');
  }

  return (
    <div className="flex h-screen justify-center items-center">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to access this web tool.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(tryLogin)}>
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-5 gap-4 items-center">
                <FormLabel className="col-span-1 text-right">Username</FormLabel>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormControl className="col-span-4">
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                  )}
                />
                <FormMessage className="col-span-5">{form.formState.errors.username?.message}</FormMessage>
              </div>
              <div className="grid grid-cols-5 gap-4 items-center">
                <FormLabel className="col-span-1 text-right">Password</FormLabel>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormControl className="col-span-4">
                      <Input 
                        id="password"
                        type="password"
                        placeholder="Password" 
                        {...field} 
                      />
                    </FormControl>
                  )}
                />
                <FormMessage className="col-span-5">{form.formState.errors.password?.message}</FormMessage>
              </div>
            </div>
            <CardFooter className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Get Access</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>I'm sorry, but this does not work right now.</AlertDialogTitle>
                    <AlertDialogDescription>
                      This feature will be added eventually with a form that will send emails to our admins.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>Ok</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit" disabled={!form.formState.isValid}>Login</Button>
            </CardFooter>
        </form>
      </Form>
    </Card>
    </div>
  );
}