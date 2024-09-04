'use client'
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import React, { useState, useEffect } from 'react';
import { AlertCircle, Send, Trash, Clipboard, Copy, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import axios from 'axios';


const initialJson = {
  datasets: [
    {
      name: "default",
      tables: [
        {
          name: "file",
          schema: {
            type: "dse",
            id: "com.gbox13.file"
          },
          inlineSchema: {
            fields: [
              { name: "id", type: "string" },
              { name: "name", type: "string" },
              { name: "size", type: "int" },
              { name: "created", type: "timestamp" }
            ]
          },
          tableType: "events-table",
          ingestion: {
            jobType: "dataflow",
            className: "com.gbox13.file.IdentityApp",
            isStreaming: true,
            inputs: [
              {
                type: "pubsub",
                fullResourceURN: "subscription://box-dev-dp-gbox.cdc",
                dataDescription: "FullTable"
              },
              {
                type: "pubsub",
                fullResourceURN: "subscription://box-dev-dp-gbox.cdc.dlq",
                dataDescription: "FullTable"
              }
            ],
            schedule: "daily",
            startDate: "2020-01-01T00:00:00Z"
          },
          executionService: {
            parallelism: 1
          }
        }
      ]
    }
  ]
};

const JsonEditorChat = () => {
  const [json, setJson] = useState(initialJson);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([{"role":"assistant","content":"Hello! How can I help you today?"}]);
  const [jsonString, setJsonString] = useState(JSON.stringify(json, null, 2));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setJsonString(JSON.stringify(json, null, 2));
  }, [json]);
  const getChat = async (question: string) => {
    if (!question) return;
    const schema ='{ "$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": { "datasets": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "tables": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "schema": { "type": "object", "properties": { "type": { "type": "string" }, "id": { "type": "string" } }, "required": ["type", "id"] }, "inlineSchema": { "type": "object", "properties": { "fields": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "type": { "type": "string" } }, "required": ["name", "type"] } } } }, "tableType": { "type": "string", "enum": ["events-table", "cdc-table", "standard-table"] }, "ingestion": { "type": "object", "properties": { "jobType": { "type": "string", "enum": ["dataflow", "dataproc", "bigquerySQL"] }, "className": { "type": "string" }, "isStreaming": { "type": "boolean" }, "inputs": { "type": "array", "items": { "type": "object", "properties": { "type": { "type": "string", "enum": ["pubsub", "bigquery", "bigtable"] }, "fullResourceURN": { "type": "string" }, "dataDescription": { "type": "string", "enum": ["FullTable", "TimeSliceCoveringOutput"] } }, "required": ["type", "fullResourceURN", "dataDescription"] } }, "schedule": { "type": "string", "enum": ["daily", "hourly", "weekly", "monthly"] }, "startDate": { "type": "string", "format": "date-time" } }, "required": ["jobType", "isStreaming", "inputs", "schedule", "startDate"] }, "executionService": { "type": "object", "properties": { "parallelism": { "type": "integer" } } } }, "required": ["name", "schema", "tableType", "ingestion"] } } }, "required": ["name", "tables"] } } }, "required": ["datasets"] }'
    const inputJson = JSON.stringify(json)
    const prompt1 = 'You are a helpful assistant that can help with json configuration modification. You are given a json file and a question. You need to answer the question based to best of your ability. You need to return the modified json file. You need to return complete json without any other text or comment. existing configuration:' + inputJson + ' user question:' + question + ' make sure to return valid json make sure you append or modify to input. Make sure you are removing existing config if your request is to add new table Re-read the question and prompt to make sure you are following the instructions. '
    const prompt = "You are a helpful assistant that can help with json configuration modification. "+ 
    " You are given a input JSON config and a question. "+
    " Make sure you are follwing json schema on the output generation: " + schema + 
    " Your task is to modify the JSON config based on the question."+
    " Return the modified JSON file as output. Return the complete JSON with-out any other text or comments."+ 
    " Here is the Existing configuration: and input json which need to be modified: " + inputJson + " and  User question: " + question + 
    ". Ensure the returned JSON is valid and correctly reflects the user's request."
    " If the request involves adding a new table, ensure the old configuration for that table is not removed" + 
    " All unspecified values we will take from an existing table. Make sure none of them are empty."
    " Re-read the question and prompt to ensure you are following the instructions. No hellucination. Return modified exsting configuration. Do not return schema in your output, please please Make sure response is readable using Json parse method"

    const payload = {
      model: "llama3.1",
      prompt: prompt,
      stream: false,
      temprature: 0
    };

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:11434/api/generate",
        payload
      );
      setLoading(false);
      return response?.data;
    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
      return "OLLAMA API not responding.... Make sure ollama is running";
    }
  };
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newMessage = { role: 'user', content: chatInput };
    setChatHistory([...chatHistory, newMessage]);
    const response = await getChat(chatInput);
    console.log(response.response)
    // Simulate AI response (replace with actual AI integration)
    
    const newConfigResponse = response.response
    //if it starts with ```json and ends with ``` remove it
    // Check if the response starts with ```json and ends with ```
    if (newConfigResponse.startsWith('```json') && newConfigResponse.endsWith('```')) {
    // Remove the ```json and ``` from the response
      //setJson(newConfigResponse.slice(7, -3).trim());
      const modifiedJsonString = newConfigResponse.slice(7, -3).trim();
      //parse into state for modifiedJson 
      console.log(modifiedJsonString)
      const modifiedJson = JSON.parse(modifiedJsonString.trim());

      console.log(modifiedJson)
      setJson(modifiedJson)
      const aiResponse = { role: 'assistant', content: `response: added new table for ${modifiedJsonString}}` };
      setChatHistory([...chatHistory, aiResponse]);
    } else {
      const aiResponse = { role: 'assistant', content: `${newConfigResponse}}` };
      setChatHistory([...chatHistory, aiResponse]);
    }
    
    setChatInput('');
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonString(e.target.value);
    try {
      const parsedJson = JSON.parse(e.target.value);
      setJson(parsedJson);
      setError("");
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const handleFormChange = (path: string[], value: any) => {
    const updateNestedObject = (obj: any, path: string[], value: any): any => {
      const [head, ...rest] = path;
      if (rest.length === 0) {
        return { ...obj, [head]: value };
      }
      return {
        ...obj,
        [head]: updateNestedObject(obj[head], rest, value)
      };
    };

    setJson(prevJson => updateNestedObject(prevJson, path, value));
  };

  const toggleSection = (key: string) => {
    setOpenSections(prevState => ({
      ...prevState,
      [key]: !prevState[key]
    }));
  };

  const renderFormFields = (obj: any, path: any[] = []) => {
    return Object.entries(obj).map(([key, value]) => {
      const currentPath = [...path, key];
      const sectionKey = currentPath.join('.');

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <Collapsible key={sectionKey} className="mb-2" open={openSections[sectionKey]}>
            <CollapsibleTrigger
              className="flex items-center font-bold hover:bg-gray-100 p-2 rounded w-full text-left"
              onClick={() => toggleSection(sectionKey)}
            >
              {openSections[sectionKey] ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              {key}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 mt-2 border-l-2 border-gray-300 pl-2">
              {renderFormFields(value, currentPath)}
            </CollapsibleContent>
          </Collapsible>
        );
      } else if (Array.isArray(value)) {
        return (
          <Collapsible key={sectionKey} className="mb-2" open={openSections[sectionKey]}>
            <CollapsibleTrigger
              className="flex items-center font-bold hover:bg-gray-100 p-2 rounded w-full text-left"
              onClick={() => toggleSection(sectionKey)}
            >
              {openSections[sectionKey] ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              {key} [{value.length}]
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 mt-2 border-l-2 border-gray-300 pl-2">
              {value.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="font-semibold">Item {index + 1}</div>
                  {renderFormFields(item, [...currentPath, index])}
                </div>
              ))}
              <Button
                onClick={() => handleFormChange(currentPath, [...value, {}])}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CollapsibleContent>
          </Collapsible>
        );
      } else {
        return (
          <div key={sectionKey} className="mb-2">
            <Label htmlFor={sectionKey}>{key}</Label>
            <Input
              id={sectionKey}
              value={value?.toString() || ''}
              onChange={(e) => handleFormChange(currentPath, e.target.value)}
              className="mt-1"
            />
          </div>
        );
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">BigQuery configuration editor with LLAMA chat</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
     
        <Card>
          <CardHeader>
            <CardTitle>BigQuery Config Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="form">
              <TabsList className="mb-4">
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="graph">
                <div className="h-[calc(100vh-300px)] overflow-y-auto bg-gray-50 p-4 rounded">
                <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Table List</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
            
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Name</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table Type</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingestion Type</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inputs</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {json.datasets[0].tables.map((table, index) => (
              <tr key={index}>
                <td className="px-2 py-2 whitespace-nowrap">{table.name}</td>
                <td className="px-2 py-2 whitespace-nowrap">{table.tableType}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {table.schema.id}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">{table.ingestion.jobType}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <ul className="list-disc list-inside">
                    {table.ingestion.inputs.map((input, index) => (
                      <li key={index}>{input.fullResourceURN}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
                </div>
              </TabsContent>
              <TabsContent value="form">
                <div className="h-[calc(100vh-300px)] overflow-y-auto bg-gray-50 p-4 rounded">
                  <div className="bg-white p-4 rounded shadow">
                    {renderFormFields(json)}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="raw">
                <Clipboard className="mb-4" onClick={() => navigator.clipboard.writeText(jsonString)}/>

                <textarea
                  value={jsonString}
                  onChange={handleJsonChange}
                  className="w-full h-[calc(100vh-300px)] p-2 font-mono text-sm border rounded"
                />
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>OLLAMA Chat Interface</CardTitle>
          
          </CardHeader>
          <CardContent>
          <Button onClick={() => setChatHistory([])}>
            <Trash className="h-4 w-4 mr-2" /> {/* Replace with delete icon */}
          </Button>
            <div className="chat-history mb-4 h-[calc(100vh-350px)] overflow-y-auto">
              
              {chatHistory.map((message, index) => (
                <div key={index} className={`mb-2 ${message?.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message?.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {message?.content}
                  </span>
                </div>
              ))}
            </div>
            {loading && <div className="mb-2">Loading...</div>}
            <form onSubmit={handleChatSubmit} className="flex">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow mr-2"
              />
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <JsonEditorChat />
      <div className="flex gap-4">
        <Link
          href={siteConfig.links.docs}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants()}
        >
          Documentation about BigQuery
        </Link>
        <Link
          target="_blank"
          rel="noreferrer"
          href={siteConfig.links.gcp}
          className={buttonVariants({ variant: "outline" })}
        >
          GCP Console
        </Link>
      </div>
    </section>
  )
}
