from wcferry import Wcf
import logging
from queue import Empty
from threading import Thread
import os
import sys
from pathlib import Path
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
LOG = logging.getLogger("WeChat")

# Login status constants
LOGIN_STATUS_WAITING = 0
LOGIN_STATUS_SCANNING = 1
LOGIN_STATUS_CONFIRMED = 2
LOGIN_STATUS_LOGGED_IN = 3

class WeChatBot:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WeChatBot, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'wcf'):
            self.wcf = Wcf(debug=True)
            self.running = False
            self.login_status = LOGIN_STATUS_WAITING
            self._setup_login_callback()
            LOG.info("WeChat Bot initialized")

    def start(self):
        """Start the bot and message processing thread"""
        try:
            self.wcf.enable_receiving_msg()
            self.running = True

            # Start message processing in a separate thread
            Thread(target=self._process_messages, daemon=True).start()
            LOG.info("Message processing thread started")

            # Keep the main thread running
            self.wcf.keep_running()
        except Exception as e:
            LOG.error(f"Failed to start bot: {e}")
            raise

    def stop(self):
        """Stop the bot gracefully"""
        self.running = False
        self.wcf.disable_receiving_msg()
        LOG.info("Bot stopped")

    def _setup_login_callback(self):
        """Setup login status monitoring"""
        def check_login_status():
            while not self.wcf.is_login():
                time.sleep(1)
            self.login_status = LOGIN_STATUS_LOGGED_IN
            LOG.info("Successfully logged in")
            self._on_login()

        Thread(target=check_login_status, daemon=True).start()

    def _process_messages(self):
        """Process incoming messages"""
        while self.running and self.wcf.is_receiving_msg():
            try:
                msg = self.wcf.get_msg()
                if msg:
                    self._handle_message(msg)
            except Empty:
                continue
            except Exception as e:
                LOG.error(f"Error processing message: {e}")

    def _handle_message(self, msg):
        """Handle different types of messages"""
        try:
            msg_type = msg.type
            content = msg.content
            sender = msg.sender
            LOG.info(f"Message from {sender}: {content} (type: {msg_type})")

            # Handle different message types
            if msg_type == 1:  # Text message
                self._handle_text_message(msg)
            elif msg_type == 3:  # Image message
                self._handle_image_message(msg)
            elif msg_type == 37:  # Friend request
                self._handle_friend_request(msg)
            elif msg_type == 10000:  # System message
                self._handle_system_message(msg)
        except Exception as e:
            LOG.error(f"Error handling message: {e}")

    def _handle_text_message(self, msg):
        """Handle text messages"""
        try:
            # TODO: Implement text message handling
            pass
        except Exception as e:
            LOG.error(f"Error handling text message: {e}")

    def _handle_image_message(self, msg):
        """Handle image messages"""
        try:
            # TODO: Implement image message handling
            pass
        except Exception as e:
            LOG.error(f"Error handling image message: {e}")

    def _handle_friend_request(self, msg):
        """Handle friend requests"""
        try:
            # TODO: Implement friend request handling
            pass
        except Exception as e:
            LOG.error(f"Error handling friend request: {e}")

    def _handle_system_message(self, msg):
        """Handle system messages"""
        try:
            # TODO: Implement system message handling
            pass
        except Exception as e:
            LOG.error(f"Error handling system message: {e}")

    def _on_login(self):
        """Handle successful login"""
        try:
            # Initialize contact data
            self.wcf.get_contacts()
            LOG.info("Contact data synchronized")

            # TODO: Initialize scheduled tasks
            # TODO: Setup backup directory
            # TODO: Load configuration
        except Exception as e:
            LOG.error(f"Error in login handler: {e}")

if __name__ == "__main__":
    try:
        bot = WeChatBot()
        bot.start()
    except KeyboardInterrupt:
        LOG.info("Shutting down bot...")
        bot.stop()
    except Exception as e:
        LOG.error(f"Bot crashed: {e}")
        sys.exit(1)
