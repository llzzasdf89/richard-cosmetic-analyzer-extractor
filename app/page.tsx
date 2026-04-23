'use client';
import { Button, Surface, ListBox, Label, CloseButton, Popover, Link } from "@heroui/react"
import {Paperclip} from "@gravity-ui/icons";
import {useState, useRef} from 'react'
import './globals.css';
import SubmitModal from "./components/submit-modal/submit-modal";
export default function Home() {
  const [uploadedFile,setUploadedFile] = useState<null | File>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const handlePress = () => {
    uploadRef?.current?.click?.()
  }
  const handleUploadFileChange = () => {
    const uploadedFile = uploadRef?.current?.files?.[0]
    if(!uploadedFile) {
      return;
    }
    setUploadedFile(uploadedFile);
  }

  const handleDeleteFile = ()=>{
    setUploadedFile(null);
    uploadRef.current!.value = ''; //清空在input element中已经上传的元素，重置状态。否则用户反复选择同一文件后是无法触发onChange事件的
  }
  return (<html>
    <body>
      <div className="bg-white">

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
              一个专业的化妆品专利成分提取器
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
              传入一份化妆品专利pdf文档，可为你提取出里面所涉及的<Popover >
                                <Link className="text-[length:inherit] font-inherit">所有成分</Link>
                                <Popover.Content className="max-w-64" placement="right top">
                                  <Popover.Dialog>
                                    <p className="text-sm text-muted">
                                      比如专利CN114533614经分析提取后生成的是这个<Link href="example.xlsx" download="CN114533614分析结果">Excel文件</Link>
                                    </p>
                                  </Popover.Dialog>
                              </Popover.Content>
                          </Popover>
            </p>
          </div>
           <Surface className="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6">
            <Button onPress={handlePress} className="self-center">
              <Paperclip/>
              尝试一下
            </Button>
            <input type="file" accept=".pdf" ref={uploadRef} className="hidden" onChange={handleUploadFileChange} />
            {
               uploadedFile?<ListBox className="border rounded-md border-gray-200 p-[12]">
                <ListBox.Item className="flex justify-between items-center" >
                  <Label>{uploadedFile.name}</Label>
                  <CloseButton onClick={() => handleDeleteFile()}></CloseButton>
                </ListBox.Item>
            </ListBox>:null
            }
            <SubmitModal uploadedFile={uploadedFile}>

            </SubmitModal>
          </Surface>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
      </div>
    </div>
    </body>
  </html>)
}
