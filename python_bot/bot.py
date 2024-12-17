import os
import time
import itchat
from itchat.content import *
from PIL import Image
import io
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

TARGET_GROUP_NAME = "选题段子积累群（能改的发进来）"

class WeChatBot:
    def __init__(self):
        load_dotenv()
        self.bot_name = os.getenv('BOT_NAME', '大壮')
        self.login_callback = None
        self.logout_callback = None
        self.qr_callback = None
        self.target_group = None

    def set_login_callback(self, callback):
        self.login_callback = callback

    def set_logout_callback(self, callback):
        self.logout_callback = callback

    def set_qr_callback(self, callback):
        self.qr_callback = callback

    def _qr_handler(self, uuid, status, qrcode):
        if status == '0':
            logger.info("Getting QR code...")
            if qrcode:
                img = Image.open(io.BytesIO(qrcode))
                qr_path = 'qr.png'
                img.save(qr_path)
                logger.info(f"QR code saved to {qr_path}")
                if self.qr_callback:
                    self.qr_callback(qr_path)
        elif status == '200':
            logger.info("Scanning completed")
        elif status == '201':
            logger.info("Confirming login...")
        elif status == '408':
            logger.warning("QR code expired, please refresh")

    def _login_handler(self):
        logger.info("Successfully logged in")
        # Find target group after successful login
        self._find_target_group()
        if self.login_callback:
            self.login_callback()

    def _logout_handler(self):
        logger.info("Logged out")
        if self.logout_callback:
            self.logout_callback()

    def _find_target_group(self):
        groups = itchat.get_chatrooms(update=True)
        for group in groups:
            if group['NickName'] == TARGET_GROUP_NAME:
                self.target_group = group
                logger.info(f"Found target group: {TARGET_GROUP_NAME}")
                return
        logger.warning(f"Target group '{TARGET_GROUP_NAME}' not found")

    @staticmethod
    def _text_reply(msg):
        if msg['FromUserName'] == msg['ToUserName']:
            logger.info(f"Received self message, ignoring: {msg['Content']}")
            return None

        if msg['Type'] != TEXT:
            return None

        is_group = msg['User'].get('MemberList') is not None
        if not is_group:
            logger.info("Ignoring non-group message")
            return None

        group_name = msg['User'].get('NickName', 'Unknown Group')
        if group_name != TARGET_GROUP_NAME:
            logger.info(f"Ignoring message from non-target group: {group_name}")
            return None

        if not msg.get('IsAt'):
            logger.info("Message does not mention bot, ignoring")
            return None

        sender = msg.get('ActualNickName', 'Unknown')
        content = msg['Content'].split('\u2005')[-1].strip()
        logger.info(f"Processing message from {sender} in {group_name}: {content}")

        chat_room = itchat.update_chatroom(userName=msg['User']['UserName'])

        response = f"收到来自 {sender} 的消息: {content}"
        logger.info(f"Sending response: {response}")
        return response

    def start(self):
        logger.info("Starting WeChat bot...")

        @itchat.msg_register([TEXT], isFriendChat=True, isGroupChat=True)
        def handle_text_msg(msg):
            return self._text_reply(msg)

        itchat.auto_login(
            enableCmdQR=False,
            hotReload=True,
            qrCallback=self._qr_handler,
            loginCallback=self._login_handler,
            exitCallback=self._logout_handler
        )
        itchat.run()

    def stop(self):
        logger.info("Stopping WeChat bot...")
        itchat.logout()
