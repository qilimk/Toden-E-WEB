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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { HelpCircle } from "lucide-react";

const PredictFormSchema = z
  .object({
    file: z.string().optional(),
    fileUpload: z.any().optional(),
    alphaSelect: z.string().optional(),
    alphaCustom: z.string().optional(),
    visualize: z
      .string()
      .nonempty({ message: "Please select Yes or No for visualize." })
      .refine(
        (val) => val === "yes" || val === "no",
        { message: "Please select Yes or No for visualize." }
      ),
    clusters: z.string().nonempty({ message: "Please select the number of clusters." }),
    summarize: z
      .string()
      .nonempty({ message: "Please select Yes or No for summarize." })
      .refine(
        (val) => val === "yes" || val === "no",
        { message: "Please select Yes or No for summarize." }
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
      clusters: "",
      summarize: "",
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
  
  async function PredictSubmit(data: z.infer<typeof PredictFormSchema>) {
    console.log(data)

    const formData = new FormData();

    // Append the file selection (if any)
    formData.append('file', data.file || '');
    
    // If a file was uploaded, add it (we assume fileUpload is an array of files)
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }
    
    // Append other form fields
    formData.append('alphaSelect', data.alphaSelect || '');
    formData.append('alphaCustom', data.alphaCustom || '');
    formData.append('visualize', data.visualize || '');
    formData.append('clusters', data.clusters || '');
    formData.append('summarize', data.summarize || '');

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('Predict result:', result);
      // Handle result (e.g., update state, show notifications, etc.)
    } catch (error) {
      console.error('Error submitting predict form:', error);
    }

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
              <CardHeader className="flex flex-row justify-between">
                <div className="flex flex-col">
                  <CardTitle>Prediction Function</CardTitle>
                  <CardDescription>This is the prediction tool.</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><HelpCircle/></Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Help</DialogTitle>
                      <DialogDescription>
                        This functionality will be built out.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button>Continue</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                                    <SelectItem value="file1">Working</SelectItem>
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

                    {/* Row 2: Alpha, Visualize, and Clusters (each spanning 1 column) */}
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="text-right">Alpha</FormLabel>
                      <div className="col-span-2">
                        <FormField
                          control={PredictForm.control}
                          name="alphaSelect"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Alpha" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Alpha</SelectLabel>
                                    <SelectItem value="0.25">0.25</SelectItem>
                                    <SelectItem value="0.5">0.5</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </div>
                      <div className="text-center col-span-1">
                        <span>or</span>
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={PredictForm.control}
                          name="alphaCustom"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Custom Alpha"
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                      <div className="text-center col-span-1">
                        <span>Visualize?</span>
                      </div>
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
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <FormLabel className="text-right">Clusters</FormLabel>
                      <div className="col-span-2">
                        <FormField
                          control={PredictForm.control}
                          name="clusters"
                          render={({ field }) => (
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Clusters" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Clusters</SelectLabel>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
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
            <CardHeader className="flex flex-row justify-between">
                <div className="flex flex-col">
                  <CardTitle>Visualize Function</CardTitle>
                  <CardDescription>This will visualize results.</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><HelpCircle/></Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Help</DialogTitle>
                      <DialogDescription>
                        This functionality will be built out.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button>Continue</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
            <CardHeader className="flex flex-row justify-between">
                <div className="flex flex-col">
                  <CardTitle>Summarize Function</CardTitle>
                  <CardDescription>This will summarize results.</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline"><HelpCircle/></Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Help</DialogTitle>
                      <DialogDescription>
                        This functionality will be built out.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button>Continue</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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