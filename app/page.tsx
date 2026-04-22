'use client';
import { Button, Spinner, Surface, ListBox, Label,AlertDialog, CloseButton } from "@heroui/react"
import {Paperclip} from "@gravity-ui/icons";
import {useState, useRef, useEffect} from 'react'
import './globals.css';
export default function Home() {
  const [isPending, setPending] = useState(false);
  const [uploadedFiles,setUploadedFiles] = useState<Array<File>>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const handlePress = () => {
    uploadRef?.current?.click?.()
  }
  const handleUploadFileChange = () => {
    const currentFileList = Array.from(uploadRef?.current?.files as FileList);
    if(!currentFileList.length) {
      return;
    }
    const filteredList = currentFileList.filter(item => !uploadedFiles.some(file => file.name === item.name));
    const targetList = [...uploadedFiles, ...filteredList];
    if(targetList.length > 9) {

    }
    setUploadedFiles([...uploadedFiles, ...filteredList]);
  }

  const handleDeleteFile = (file:File)=>{
    setUploadedFiles(uploadedFiles.filter(item => item.name !== file.name))
    uploadRef.current!.value = ''; //清空在input element中已经上传的元素，重置状态。否则用户反复选择同一文件后是无法触发onChange事件的
  }

  const handleSubmit = async () => {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file)
      })
      const response = (await fetch('/api/files', {
        method:'post',
        body:formData,
      }));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a')
      a.href = url
      a.download = 'output.xlsx'
      a.click()
      URL.revokeObjectURL(url)
  }

  useEffect(() => {
    console.log('uploadedFiles is ', uploadedFiles)
  }, [uploadedFiles])
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
              一个专业的专利分析器
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
              在下方传入你的专利PDF文档（不超过9个）
            </p>
          </div>
           <Surface className="flex min-w-[320px] flex-col gap-3 rounded-3xl p-6 mt-12" variant="secondary">
            <Button isPending={isPending} onPress={handlePress} className="self-center">
              {isPending?<Spinner color="current" size="sm"></Spinner>:<Paperclip/>}
              {isPending?'uploading...':'点击这里'}
            </Button>
            <input type="file" accept=".pdf" ref={uploadRef} className="hidden" onChange={handleUploadFileChange} multiple />
            {
               uploadedFiles.length > 0?<ListBox >
                {uploadedFiles.map((file,index) => 
                <ListBox.Item key={index} id={index} className="flex justify-between items-center" >
                  <Label>{file.name}</Label>
                  <CloseButton onClick={() => handleDeleteFile(file)}></CloseButton>
                </ListBox.Item>)}
            </ListBox>:null
            }
            {
              uploadedFiles?.length > 9? 
              (
              <AlertDialog>
                <Button className="self-center">提交</Button>
                <AlertDialog.Backdrop>
                  <AlertDialog.Container>
                    <AlertDialog.Dialog
                    >
                      <AlertDialog.CloseTrigger />
                      <AlertDialog.Header>
                        <AlertDialog.Icon status="danger" />
                        <AlertDialog.Heading>已达文件数量上限</AlertDialog.Heading>
                      </AlertDialog.Header>
                      <AlertDialog.Body>
                        <p>
                          最多只允许上传9个文件
                        </p>
                      </AlertDialog.Body>
                      <AlertDialog.Footer>
                        <Button slot="close" variant="danger">
                          确认
                        </Button>
                      </AlertDialog.Footer>

                    </AlertDialog.Dialog>
                    
                  </AlertDialog.Container>
                </AlertDialog.Backdrop>
              </AlertDialog>):uploadedFiles?.length > 0? <Button className="self-center" onClick={handleSubmit}>提交</Button>:null
            }
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
