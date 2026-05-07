import { QrCode } from "@gravity-ui/icons";
import { Modal,Button, ProgressCircle, Link, Disclosure} from "@heroui/react"
import { useState } from "react";
interface SubmitModalProps {
    uploadedFile:null | File
}
interface ModalContentProps {
  loading:boolean;
  downloadLink:string;
  error:unknown | null;
  fetchFunc:() => void;
}
const MAX_RETRY_TIME = 3; //最大重连次数
const ModalContent = ({
  loading = false,
  downloadLink = '',
  error = null,
  fetchFunc = async ()=>{},
}:ModalContentProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const handleRetry = () => {
    setRetryCount(retryCount+1);
    if(retryCount >= MAX_RETRY_TIME) {
      return;
    }
    fetchFunc()
  }
  if(loading) {
    return  <ProgressCircle isIndeterminate aria-label="Loading" className='flex-col gap-[16] text-center'>
      <p className="text-black text-base font-medium">
      根据你所上传的文件大小，可能需要约3-10分钟不等，请耐心等候
      </p>
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>;
  }
  if(error && retryCount < MAX_RETRY_TIME) {
    return <p className="text-base text-danger font-medium">
      分析出错，<Link className='underline text-base' onPress={handleRetry}>重试一下? <Link.Icon /></Link>
    </p>
  }
  else if(error && retryCount >= MAX_RETRY_TIME) {
    return <Disclosure>
        <Disclosure.Heading className="flex items-center gap-[16] flex-col">
          <p className="text-danger text-base font-medium">
            Oops, 系统异常啦！你可以尝试
          </p>
          <Button slot="trigger" variant="secondary">
            <QrCode />
              联系开发者
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="shadow-panel flex flex-col items-center rounded-3xl bg-surface p-4 text-center">
            <img
              alt="开发者二维码"
              className="aspect-square w-full max-w-54 object-cover"
              src="wechat--QR-code.jpg"
            />
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
  }
  return  <p className="text-base font-medium">
    分析完成，<Link href={downloadLink} className="text-base font-medium text-(--button-primary) decoration-(--button-primary)">
    下载分析结果
    <Link.Icon></Link.Icon>
    </Link>
  </p>
}


export default function SubmitModal({
    uploadedFile = null
}:SubmitModalProps){
    const [loading, setLoading] = useState(false);
    const [downloadLink, setDownloadLink] = useState('');
    const [error, setError] = useState<unknown>(null);
    const handleSubmit = async () => {
          if(loading || !uploadedFile) {
            return;
          }
          setError(null);
          setLoading(true);
          const formData = new FormData();
          formData.append('file', uploadedFile);
          try { 
            const response = (await fetch('/api/files', {
              method:'post',
              body:formData,
            }));
            if(response.status !== 200) {
              const {message = ''} = await response.json?.() || {}
              throw Error(message)
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setDownloadLink(url);
          }
          catch(err) {
            console.error('分析错误',err);
            setError(err);
          } finally { 
            setLoading(false);
          }
      }
    if(uploadedFile) {
        return <Modal>
            <Button onPress={handleSubmit} className="self-center" variant="outline">送去分析</Button>
            <Modal.Backdrop isDismissable={false}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px] p-[48]">
            {loading?null:<Modal.CloseTrigger />}
            <Modal.Body className="flex justify-center items-center overflow-hidden">
              <ModalContent
              loading={loading}
              downloadLink={downloadLink}
              error={error}
              fetchFunc={handleSubmit}
              >

              </ModalContent>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
        </Modal>
    }
    return null;
}