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

class WeChatBot:
    def __init__(self):
        load_dotenv()
        self.bot_name = os.getenv('BOT_NAME', '大壮')
        self.login_callback = None
        self.logout_callback = None
        self.qr_callback = None

    def set_login_callback(self, callback):
        self.login_callback = callback

    def set_logout_callback(self, callback):
        self.logout_callback = callback

    def set_qr_callback(self, callback):
        self.qr_callback = callback

    def _qr_handler(self, uuid, status, qrcode):
        """Handle QR code events"""
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
        """Handle login events"""
        logger.info("Successfully logged in")
        if self.login_callback:
            self.login_callback()

    def _logout_handler(self):
        """Handle logout events"""
        logger.info("Logged out")
        if self.logout_callback:
            self.logout_callback()

    @staticmethod
    def _text_reply(msg):
        """Handle text messages"""
        if msg['FromUserName'] == msg['ToUserName']:
            logger.info(f"Received self message, ignoring: {msg['Content']}")
            return None

        if msg['Type'] == TEXT:
            is_group = msg['User'].get('MemberList') is not None
            if is_group:
                sender = msg.get('ActualNickName', 'Unknown')
                group_name = msg['User'].get('NickName', 'Unknown Group')
                logger.info(f"Received group message from {sender} in {group_name}: {msg['Content']}")
                return f"收到群消息: {msg['Content']}"
            else:
                sender = msg['User'].get('NickName', 'Unknown')
                logger.info(f"Received private message from {sender}: {msg['Content']}")
                return f"收到消息: {msg['Content']}"
        return None

    def start(self):
        """Start the WeChat bot"""
        logger.info("Starting WeChat bot...")

        # Register message handlers
        @itchat.msg_register([TEXT], isFriendChat=True, isGroupChat=True)
        def handle_text_msg(msg):
            return self._text_reply(msg)

        # Start bot with QR code callback
        itchat.auto_login(
            enableCmdQR=False,
            hotReload=True,
            qrCallback=self._qr_handler,
            loginCallback=self._login_handler,
            exitCallback=self._logout_handler
        )
        itchat.run()

    def stop(self):
        """Stop the WeChat bot"""
        logger.info("Stopping WeChat bot...")
        itchat.logout()
