// app/home/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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
import { Progress } from "@/components/ui/progress";
import DynamicGraph from "@/components/DynamicGraph";

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
    fileUpload: z.any().optional(),
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

interface TabsContentProps {
  clustersData: any;
  setClustersData: (data: any) => void;
}

export default function Home({ clustersData, setClustersData }: TabsContentProps) {
  const [predictFileKey, setPredictFileKey] = useState(0);
  const [visualizeFileKey, setVisualizeFileKey] = useState(0);
  const [summarizeFileKey, setSummarizeFileKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    // Reset progress to 0 when a request starts.
    setProgress(0);
    const timer10 = setTimeout(() => setProgress(10), 10000);     // at 10 sec, progress = 10
    const timer30 = setTimeout(() => setProgress(30), 30000);     // at 30 sec, progress = 30
    const timer60 = setTimeout(() => setProgress(60), 60000);     // at 60 sec, progress = 60
    const timer100 = setTimeout(() => setProgress(100), 100000);  // at 100 sec, progress = 100

    // Cleanup the timers if the request completes early.
    return () => {
      clearTimeout(timer10);
      clearTimeout(timer30);
      clearTimeout(timer60);
      clearTimeout(timer100);
    };
  }, [isLoading]);

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
    setIsLoading(true);
    setProgress(0);

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

    PredictForm.reset();

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (response.status !== 200) {
        setAlertOpen(true);
      }

      const result = await response.json();
      console.log('Predict result:', result);
      // Handle result (e.g., update state, show notifications, etc.)
    } catch (error) {
      console.error('Error submitting predict form:', error);
    } finally {
      setIsLoading(false); // end loading regardless of outcome
      setPredictFileKey(prev => prev + 1);
    }
  }

  async function VisualizeSubmit(data: z.infer<typeof VisualizeFormSchema>) {
    console.log(data);
    setIsLoading(true);
    setProgress(0);
    const formData = new FormData();
  
    // Append file selection (if any)
    formData.append('file', data.file || '');
    
    // Append file upload (if provided)
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }

    VisualizeForm.reset();
    
    try {
      const response = await fetch('http://localhost:5000/visualize', {
        method: 'POST',
        body: formData,
      });

      if (response.status !== 200) {
        setAlertOpen(true);
      }

      const result = await response.json();
      console.log('Visualize result:', result);
      setClustersData(result.result);
      console.log(clustersData)
      // Handle result as needed (e.g., update state, show notifications, etc.)
    } catch (error) {
      console.error('Error submitting visualize form:', error);
    } finally {
      setIsLoading(false);
      setVisualizeFileKey(prev => prev + 1);
    }
  }

  async function SummarizeSubmit(data: z.infer<typeof SummarizeFormSchema>) {
    console.log(data);
    setIsLoading(true);
    setProgress(0);
    const formData = new FormData();
  
    // Append file selection (if any)
    formData.append('file', data.file || '');
    
    // Append file upload (if provided)
    if (data.fileUpload && data.fileUpload.length > 0) {
      formData.append('fileUpload', data.fileUpload[0]);
    }

    SummarizeForm.reset();
    
    try {
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        body: formData,
      });

      if (response.status !== 200) {
        setAlertOpen(true);
      }

      const result = await response.json();
      console.log('Summarize result:', result);
      // Handle result as needed (e.g., update state, show notifications, etc.)
    } catch (error) {
      console.error('Error submitting summarize form:', error);
      setAlertOpen(true);
    } finally {
      setIsLoading(false);
      setSummarizeFileKey(prev => prev + 1);
    }
  }

  return (
      <div className="flex flex-col justify-center items-center">
        {isLoading ? (
          // Show progress bar if waiting for backend response.
          <div className="w-1/2">
            <Progress value={progress} max={120} />
          </div>
        )
        : 
        (
        <Tabs defaultValue="predict">
          <TabsList className="grid w-full grid-cols-3 space-x-2">
            <TabsTrigger value="predict">Predict</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
            <TabsTrigger value="summarize">Summarize</TabsTrigger>
            {/* <TabsTrigger value="partition-score">Partition Score</TabsTrigger> */}
          </TabsList>
          <TabsContent value="predict">
            <Card className="w-full">
              <CardHeader className="flex flex-row justify-between">
                <div className="flex flex-col">
                  <CardTitle>Prediction Function</CardTitle>
                  <CardDescription>This is the prediction tool.</CardDescription>
                </div>
                <Dialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <HelpCircle />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How It Works</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>How It Works</DialogTitle>
                      <DialogDescription className="flex flex-col space-y-2">
                        <p>
                          The Predict Function allows the user to select or upload a file, 
                          select or enter an alpha value, choose whether or not they want visualization, 
                          choose number of clusters, and choose whether or not they want summarization.
                          Upon submission, there will be a loading period where the user will need to wait
                          for Toden-E to complete its calculations. Then, Toden-E will forward the user to the page corresponding
                          to the user's desired Toden-E functionality.
                        </p>
                        <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                          Example File Format
                        </p>
                        <p>
                          Here is the format of the file needed for the tool to work properly {'(Use .txt files)'}:
                        </p>
                        <p>
                        GO: {'{id}'}
                        </p>
                        <p>
                        GO: {'{id}'}
                        </p>
                        <p>
                        ...
                        </p>
                        <p>
                        GO: {'{id}'}
                        </p>
                        <p>
                          Example of an id: 0006413
                        </p>
                        <p>
                          Visit {'(link goes here)'} to get ids
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          A file selection takes precedent over a file upload and an alpha value selection takes precedent over a custom alpha value.
                        </p>
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
                                    <SelectItem value="default">Working</SelectItem>
                                    {/* <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem> */}
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
                                accept=".txt"
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
                                min="0"
                                max="1"
                                step="0.05"
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
                      <FormLabel className="text-right">Summarize</FormLabel>
                      <div className="col-span-1">
                        <FormField
                          control={PredictForm.control}
                          name="summarize"
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
                  <CardFooter className="space-x-4">
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <HelpCircle />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How It Works</p>
                      </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>How It Works</DialogTitle>
                      <DialogDescription className="flex flex-col space-y-2">
                        <p>
                          The Summarize Function allows the user to select or upload a file for summarization.
                          Upon submission, there will be a loading period where the user will need to wait
                          for Toden-E to complete its summarization. Then, Toden-E will forward the user to the page corresponding
                          to the user's desired Toden-E functionality.
                        </p>
                        <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                          Example File Format
                        </p>
                        <p>
                          Here is the format of the file to visualize n clusters {'(Use .csv files curated by Toden-E Predict)'}:
                        </p>
                        <p>
                        ID,0,..., n - 1
                        </p>
                        <p>
                        {'{Clustering Algorithm}'}, {'{Cluster_1_IDs}'}, ..., {'{Cluster_(n - 1)_IDs}'}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          A file selection takes precedent over a file upload.
                        </p>
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
                                    <SelectItem value="default">Working</SelectItem>
                                    {/* <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem> */}
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
                                accept=".csv"
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <HelpCircle />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How It Works</p>
                    </TooltipContent>
                  </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>How It Works</DialogTitle>
                      <DialogDescription className="flex flex-col space-y-2">
                        <p>
                          The Summarize Function allows the user to select or upload a file for summarization.
                          Upon submission, there will be a loading period where the user will need to wait
                          for Toden-E to complete its summarization. Then, Toden-E will forward the user to the page corresponding
                          to the user's desired Toden-E functionality.
                        </p>
                        <p className="text-lg font-semibold leading-none tracking-tight dark:text-white">
                          Example File Format
                        </p>
                        <p>
                          Here is the format of the file to summarize n clusters {'(Use .csv files curated by Toden-E Predict)'}:
                        </p>
                        <p>
                        ID,0,..., n - 1
                        </p>
                        <p>
                        {'{Clustering Algorithm}'}, {'{Cluster_1_IDs}'}, ..., {'{Cluster_(n - 1)_IDs}'}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          A file selection takes precedent over a file upload.
                        </p>
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
                                    <SelectItem value="default">Working</SelectItem>
                                    {/* <SelectItem value="file2">File2</SelectItem>
                                    <SelectItem value="file3">File3</SelectItem>
                                    <SelectItem value="file4">File4</SelectItem> */}
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
                                accept=".csv"
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
       )}
       <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>There was an error in fulfilling your request. Please try again.</AlertDialogTitle>
            <AlertDialogDescription>
              If this problem persists, please contact us at: xyz1234@auburn.edu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  );
}