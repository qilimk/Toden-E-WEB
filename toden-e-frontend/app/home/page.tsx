// app/home/page.tsx
"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import Navbar from '@/components/navbar';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const PredictFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(), // typically a FileList
    alphaSelect: z.string().optional(),
    alphaCustom: z.string().optional(), // converts input string to number
    visualize: z
      .string()
      .nonempty({ message: "Please select Yes or No for visualize." })
      .refine(
        (val) => val === "yes" || val === "no",
        { message: "Please select Yes or No for visualize." }
      ),
  })
  // Ensure at least one of file or fileUpload is provided
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
  )
  // Ensure at least one of alphaSelect or alphaCustom is provided
  .refine(
    (data) =>
      (data.alphaSelect && data.alphaSelect.trim() !== "") ||
      (data.alphaCustom && data.alphaCustom.trim() !== ""),
    { message: "Please select an alpha value or enter a custom one.", path: ["alphaCustom"] }
);

const VisualizeFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(), // FileList from file input
  })
  // Ensure at least one file input (select or upload) is provided.
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
);

const SummarizeFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(), // FileList from the file input
  })
  .refine(
    (data) => data.file || (data.fileUpload && data.fileUpload.length > 0),
    { message: "Please select a file or upload one.", path: ["fileUpload"] }
);

// const PartitionFormSchema = z.object({
//   function: z.string().min(7, {
//     message: "Function must be selected.",
//   }).max(50),
// });

export default function Home() {
  const [predictFileKey, setPredictFileKey] = useState(0);
  const [visualizeFileKey, setVisualizeFileKey] = useState(0);
  const [summarizeFileKey, setSummarizeFileKey] = useState(0);

  const PredictForm = useForm({
    resolver: zodResolver(PredictFormSchema),
    defaultValues: {
      file: "",
      fileUpload: "",
      alphaSelect: "",
      alphaCustom: "",
      visualize: "",
    },
  });

  const VisualizeForm = useForm({
    resolver: zodResolver(VisualizeFormSchema),
    defaultValues: {
      file: "",
      fileUpload: undefined,
    },
  });

  const SummarizeForm = useForm({
    resolver: zodResolver(SummarizeFormSchema),
    defaultValues: {
      file: "",
      fileUpload: undefined,
    },
  });
  
  function PredictSubmit(data: z.infer<typeof PredictFormSchema>) {
    console.log(data)
    PredictForm.reset();
    setPredictFileKey(prev => prev + 1);
  }

  function VisualizeSubmit(data: z.infer<typeof VisualizeFormSchema>) {
    console.log(data)
    VisualizeForm.reset();
    setVisualizeFileKey(prev => prev + 1);
  }

  function SummarizeSubmit(data: z.infer<typeof SummarizeFormSchema>) {
    console.log(data)
    SummarizeForm.reset();
    setSummarizeFileKey(prev => prev + 1);
  }

  return (
    <div>
      <Navbar />
      <div className="flex flex-col h-screen justify-center items-center">
        <Tabs defaultValue="predict">
          <TabsList className="grid w-full grid-cols-3 space-x-2">
            <TabsTrigger value="predict">Predict</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
            <TabsTrigger value="summarize">Summarize</TabsTrigger>
            {/* <TabsTrigger value="partition-score">Partition Score</TabsTrigger> */}
          </TabsList>
          <TabsContent value="predict">
            <Card className="w-[1000px]">
              <CardHeader>
                <CardTitle>Prediction Function</CardTitle>
                <CardDescription>This is the prediction tool.</CardDescription>
              </CardHeader>
              <Form {...PredictForm}>
                <form onSubmit={PredictForm.handleSubmit(PredictSubmit)}>
                  <div className="px-4 pb-4 space-y-4">
                    {/* Row 1: File selection */}
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="col-span-1 text-right">File Selection</FormLabel>
                      {/* Select input (choose file from dropdown) */}
                      <div className="col-span-3">
                        <FormField
                          control={PredictForm.control}
                          name="file"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a file..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>File</SelectLabel>
                                    <SelectItem value="file1">File1</SelectItem>
                                    <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                      {/* "or" text */}
                      <div className="col-span-1 text-center">
                        <span>or</span>
                      </div>
                      {/* File upload input */}
                      <div className="col-span-3">
                        <FormField
                          control={PredictForm.control}
                          name="fileUpload"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                key={`predict-file-${predictFileKey}`}
                                type="file"
                                onChange={(e) => field.onChange(e.target.files)}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>

                    {/* Row 2: Alpha selection/custom entry and visualize option */}
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="col-span-1 text-right">Alpha</FormLabel>
                      {/* Predefined alpha select */}
                      <div className="col-span-2">
                        <FormField
                          control={PredictForm.control}
                          name="alphaSelect"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select alpha" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Alpha</SelectLabel>
                                    <SelectItem value="0.1">0.1</SelectItem>
                                    <SelectItem value="0.2">0.2</SelectItem>
                                    <SelectItem value="0.3">0.3</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                      {/* "or" text */}
                      <div className="col-span-1 text-center">
                        <span>or</span>
                      </div>
                      {/* Custom alpha input */}
                      <div className="col-span-2">
                        <FormField
                          control={PredictForm.control}
                          name="alphaCustom"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Custom alpha"
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                      {/* "visualize" text */}
                      <div className="col-span-1 text-center">
                        <span>Visualize?</span>
                      </div>
                      {/* Yes/No select for visualize */}
                      <div className="col-span-1">
                        <FormField
                          control={PredictForm.control}
                          name="visualize"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Yes/No" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <CardFooter className="flex space-x-4">
                    <Button 
                      variant="destructive" 
                      onClick={() =>{
                        PredictForm.reset();
                        setPredictFileKey(prev => prev + 1);
                      }}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={!PredictForm.formState.isValid}>
                      Submit
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          <TabsContent value="visualize">
            <Card className="w-[1000px]">
              <CardHeader>
                <CardTitle>Visualize Function</CardTitle>
                <CardDescription>This is the visualization tool.</CardDescription>
              </CardHeader>
              <Form {...VisualizeForm}>
                <form onSubmit={VisualizeForm.handleSubmit(VisualizeSubmit)}>
                  <div className="px-4 pb-4 space-y-4">
                    {/* File Selection Row */}
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="col-span-1 text-right">
                        File Selection
                      </FormLabel>
                      {/* Select input for file choice */}
                      <div className="col-span-3">
                        <FormField
                          control={VisualizeForm.control}
                          name="file"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a file..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>File</SelectLabel>
                                    <SelectItem value="file1">File1</SelectItem>
                                    <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                      {/* "or" text */}
                      <div className="col-span-1 text-center">
                        <span>or</span>
                      </div>
                      {/* File upload input */}
                      <div className="col-span-3">
                        <FormField
                          control={VisualizeForm.control}
                          name="fileUpload"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                key={`visualize-file-${visualizeFileKey}`}
                                type="file"
                                onChange={(e) => field.onChange(e.target.files)}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <CardFooter className="flex space-x-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        VisualizeForm.reset();
                        setVisualizeFileKey(prev => prev + 1);
                      }}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={!VisualizeForm.formState.isValid}>
                      Submit
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
          <TabsContent value="summarize">
            <Card className="w-[1000px]">
              <CardHeader>
                <CardTitle>Summarize Function</CardTitle>
                <CardDescription>This is the summarization tool.</CardDescription>
              </CardHeader>
              <Form {...SummarizeForm}>
                <form onSubmit={SummarizeForm.handleSubmit(SummarizeSubmit)}>
                  <div className="px-4 pb-4 space-y-4">
                    {/* File Selection Row */}
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="col-span-1 text-right">
                        File Selection
                      </FormLabel>
                      {/* Select input for file choice */}
                      <div className="col-span-3">
                        <FormField
                          control={SummarizeForm.control}
                          name="file"
                          render={({ field }) => (
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a file..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>File</SelectLabel>
                                    {/* Blank option so that resetting shows no selection */}
                                    <SelectItem value="file1">File1</SelectItem>
                                    <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                      {/* "or" text */}
                      <div className="col-span-1 text-center">
                        <span>or</span>
                      </div>
                      {/* File upload input */}
                      <div className="col-span-3">
                        <FormField
                          control={SummarizeForm.control}
                          name="fileUpload"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                key={`summarize-file-${summarizeFileKey}`}
                                type="file"
                                onChange={(e) => field.onChange(e.target.files)}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <CardFooter className="flex space-x-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        SummarizeForm.reset();
                        setSummarizeFileKey(prev => prev + 1);
                      }}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={!SummarizeForm.formState.isValid}>
                      Submit
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        {/* <TabsContent value="partition-score">
          Im sorry, not available.
        </TabsContent> */}
      </Tabs>
      </div>
    </div>
  );
}