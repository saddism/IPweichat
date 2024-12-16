#!/usr/bin/env python3
import os
import sys
from pathlib import Path
import logging
from dotenv import load_dotenv
from bot import WeChatBot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
LOG = logging.getLogger("WeChat-Startup")

def main():
    """Initialize and start the WeChat bot"""
    try:
        # Load environment variables
        env_path = Path(__file__).parent.parent / '.env'
        load_dotenv(env_path)

        # Initialize and start bot
        LOG.info("Starting WeChat bot...")
        bot = WeChatBot()
        bot.start()
    except KeyboardInterrupt:
        LOG.info("Shutting down bot...")
        bot.stop()
    except Exception as e:
        LOG.error(f"Failed to start bot: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
