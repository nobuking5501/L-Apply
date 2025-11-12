/**
 * リッチメニュー設定スクリプト
 *
 * 使い方:
 * 1. リッチメニュー画像を用意 (2500x1686px または 2500x843px)
 * 2. 画像ファイルのパスを IMAGE_PATH に設定
 * 3. node scripts/setup-richmenu.js を実行
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 環境変数から読み込み
require('dotenv').config({ path: path.join(__dirname, '../functions/.env') });

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_ID = process.env.LIFF_ID;
const APP_BASE_URL = process.env.APP_BASE_URL;

// リッチメニュー画像のパス（相対パスまたは絶対パス）
const IMAGE_PATH = path.join(__dirname, '../richmenu-image.png');

// LINE APIのベースURL
const LINE_API_BASE = 'https://api.line.me/v2/bot';

/**
 * リッチメニューを作成
 */
async function createRichMenu() {
  const richMenuData = {
    size: {
      width: 2500,
      height: 1686 // 大テンプレート（6分割）
    },
    selected: true,
    name: 'L-Applyメインメニュー',
    chatBarText: 'メニュー',
    areas: [
      // 左上: セミナー申込
      {
        bounds: {
          x: 0,
          y: 0,
          width: 833,
          height: 843
        },
        action: {
          type: 'uri',
          label: 'セミナー申込',
          uri: `https://liff.line.me/${LIFF_ID}`
        }
      },
      // 中上: 予約確認
      {
        bounds: {
          x: 833,
          y: 0,
          width: 834,
          height: 843
        },
        action: {
          type: 'message',
          label: '予約確認',
          text: '予約確認'
        }
      },
      // 右上: キャンセル
      {
        bounds: {
          x: 1667,
          y: 0,
          width: 833,
          height: 843
        },
        action: {
          type: 'message',
          label: 'キャンセル',
          text: 'キャンセル'
        }
      },
      // 左下: お知らせ
      {
        bounds: {
          x: 0,
          y: 843,
          width: 833,
          height: 843
        },
        action: {
          type: 'uri',
          label: 'お知らせ',
          uri: APP_BASE_URL
        }
      },
      // 中下: 配信停止
      {
        bounds: {
          x: 833,
          y: 843,
          width: 834,
          height: 843
        },
        action: {
          type: 'message',
          label: '配信停止',
          text: '配信停止'
        }
      },
      // 右下: 再開
      {
        bounds: {
          x: 1667,
          y: 843,
          width: 833,
          height: 843
        },
        action: {
          type: 'message',
          label: '再開',
          text: '再開'
        }
      }
    ]
  };

  try {
    console.log('リッチメニューを作成中...');
    const response = await axios.post(
      `${LINE_API_BASE}/richmenu`,
      richMenuData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✓ リッチメニューを作成しました');
    console.log('リッチメニューID:', response.data.richMenuId);
    return response.data.richMenuId;
  } catch (error) {
    console.error('✗ リッチメニューの作成に失敗しました:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * リッチメニューに画像をアップロード
 */
async function uploadRichMenuImage(richMenuId, imagePath) {
  try {
    console.log('画像をアップロード中...');

    // 画像ファイルを読み込み
    const imageBuffer = fs.readFileSync(imagePath);

    await axios.post(
      `${LINE_API_BASE}/richmenu/${richMenuId}/content`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'image/png',
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✓ 画像をアップロードしました');
  } catch (error) {
    console.error('✗ 画像のアップロードに失敗しました:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * リッチメニューをデフォルトに設定
 */
async function setDefaultRichMenu(richMenuId) {
  try {
    console.log('リッチメニューをデフォルトに設定中...');

    await axios.post(
      `${LINE_API_BASE}/user/all/richmenu/${richMenuId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    console.log('✓ リッチメニューをデフォルトに設定しました');
  } catch (error) {
    console.error('✗ デフォルト設定に失敗しました:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 既存のリッチメニューを削除
 */
async function deleteAllRichMenus() {
  try {
    console.log('既存のリッチメニューを確認中...');

    // リッチメニュー一覧を取得
    const response = await axios.get(
      `${LINE_API_BASE}/richmenu/list`,
      {
        headers: {
          'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
        }
      }
    );

    const richMenus = response.data.richmenus || [];

    if (richMenus.length === 0) {
      console.log('削除するリッチメニューはありません');
      return;
    }

    console.log(`${richMenus.length}個のリッチメニューを削除中...`);

    // すべてのリッチメニューを削除
    for (const richMenu of richMenus) {
      await axios.delete(
        `${LINE_API_BASE}/richmenu/${richMenu.richMenuId}`,
        {
          headers: {
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
          }
        }
      );
      console.log(`✓ リッチメニュー ${richMenu.richMenuId} を削除しました`);
    }
  } catch (error) {
    console.error('✗ リッチメニューの削除に失敗しました:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('L-Apply リッチメニュー設定スクリプト');
    console.log('='.repeat(50));
    console.log();

    // 環境変数の確認
    if (!CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    }
    if (!LIFF_ID) {
      throw new Error('LIFF_ID が設定されていません');
    }

    // 画像ファイルの確認
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error(`✗ 画像ファイルが見つかりません: ${IMAGE_PATH}`);
      console.log();
      console.log('リッチメニュー画像を以下のパスに配置してください:');
      console.log(`  ${IMAGE_PATH}`);
      console.log();
      console.log('または、スクリプト内の IMAGE_PATH を変更してください。');
      process.exit(1);
    }

    console.log('設定情報:');
    console.log(`  LIFF URL: https://liff.line.me/${LIFF_ID}`);
    console.log(`  Base URL: ${APP_BASE_URL}`);
    console.log(`  画像パス: ${IMAGE_PATH}`);
    console.log();

    // 既存のリッチメニューを削除
    await deleteAllRichMenus();
    console.log();

    // 新しいリッチメニューを作成
    const richMenuId = await createRichMenu();
    console.log();

    // 画像をアップロード
    await uploadRichMenuImage(richMenuId, IMAGE_PATH);
    console.log();

    // デフォルトに設定
    await setDefaultRichMenu(richMenuId);
    console.log();

    console.log('='.repeat(50));
    console.log('✓ リッチメニューの設定が完了しました！');
    console.log('='.repeat(50));
    console.log();
    console.log('LINEアプリでBotを開いて確認してください。');
    console.log();

  } catch (error) {
    console.error();
    console.error('='.repeat(50));
    console.error('✗ エラーが発生しました');
    console.error('='.repeat(50));
    console.error(error.message);
    process.exit(1);
  }
}

// スクリプト実行
main();
