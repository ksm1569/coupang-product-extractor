function extractProductInfo() {
  // 상품명 추출 - 새로운 셀렉터 사용
  const title = document.querySelector('body > div.sdp-content.twc-m-auto.twc-min-w-\\[320px\\].twc-max-w-\\[1500px\\].twc-px-\\[16px\\].md\\:twc-px-\\[20px\\].max-\\[600px\\]\\:twc-pb-\\[58px\\].twc-border-t-\\[1px\\].twc-border-\\[\\#dfe3e8\\] > div.twc-flex.twc-max-w-full > main > div.prod-atf.twc-block.md\\:twc-flex.twc-relative > div.prod-atf-contents.twc-relative.twc-flex-1.twc-min-w-0 > div.product-buy-header > div.twc-flex.twc-justify-between.twc-items-start > div:nth-child(1) > h1 > span')?.textContent?.trim();

  // 가격 추출 - 새로운 셀렉터 사용 (원 제거)
  const price = document.querySelector('body > div.sdp-content.twc-m-auto.twc-min-w-\\[320px\\].twc-max-w-\\[1500px\\].twc-px-\\[16px\\].md\\:twc-px-\\[20px\\].max-\\[600px\\]\\:twc-pb-\\[58px\\].twc-border-t-\\[1px\\].twc-border-\\[\\#dfe3e8\\] > div.twc-flex.twc-max-w-full > main > div.prod-atf.twc-block.md\\:twc-flex.twc-relative > div.prod-atf-contents.twc-relative.twc-flex-1.twc-min-w-0 > div.price-container.twc-relative > div.final-price.twc-flex.twc-items-center.twc-flex-wrap > div.price-amount.final-price-amount')?.textContent?.trim()
      .replace('원', '').replace(/,/g, '');

  // 이미지 URL 추출 - 새로운 셀렉터 사용 (최대 4개, 있는 것만)
  const imageUrls = [];
  
  // 첫 번째 이미지 (대표 이미지)
  const firstImg = document.querySelector('body > div.sdp-content.twc-m-auto.twc-min-w-\\[320px\\].twc-max-w-\\[1500px\\].twc-px-\\[16px\\].md\\:twc-px-\\[20px\\].max-\\[600px\\]\\:twc-pb-\\[58px\\].twc-border-t-\\[1px\\].twc-border-\\[\\#dfe3e8\\] > div.twc-flex.twc-max-w-full > main > div.prod-atf.twc-block.md\\:twc-flex.twc-relative > div.product-image.twc-flex-1.md\\:twc-flex > div > div > img');
  if (firstImg && firstImg.src) {
    const imgUrl = firstImg.src
        .replace(/^\/\//, 'https://')
        .replace(/\/\d+x\d+ex\//, '/492x492ex/');
    imageUrls.push(imgUrl);
  }
  
  // 두 번째, 세 번째, 네 번째 이미지
  for (let i = 2; i <= 4; i++) {
    const img = document.querySelector(`body > div.sdp-content.twc-m-auto.twc-min-w-\\[320px\\].twc-max-w-\\[1500px\\].twc-px-\\[16px\\].md\\:twc-px-\\[20px\\].max-\\[600px\\]\\:twc-pb-\\[58px\\].twc-border-t-\\[1px\\].twc-border-\\[\\#dfe3e8\\] > div.twc-flex.twc-max-w-full > main > div.prod-atf.twc-block.md\\:twc-flex.twc-relative > div.product-image.twc-flex-1.md\\:twc-flex > ul > li:nth-child(${i}) > img`);
    if (img && img.src) {
      const imgUrl = img.src
          .replace(/^\/\//, 'https://')
          .replace(/\/\d+x\d+ex\//, '/492x492ex/');
      imageUrls.push(imgUrl);
    }
  }

  // 품목 관련 정보 추출
  let modelName = '';
  const rows = document.querySelectorAll('.prod-delivery-return-policy-table tr');
  for (const row of rows) {
    const th = row.querySelector('th');
    const thText = th?.textContent?.trim() || '';
    if (thText.includes('품목')) {
      modelName = row.querySelector('td')?.textContent?.trim() || '';
      break;
    }
  }

  // 별점 정보 추출
  let rating = 0;
  const ratingElement = document.querySelector('#prod-review-nav-link .rating-star-num');
  if (ratingElement) {
    const widthStyle = ratingElement.style.width;
    if (widthStyle) {
      // 퍼센트 값을 추출 (예: "100.0%" -> 100.0)
      const percentValue = parseFloat(widthStyle.replace('%', ''));
      // 퍼센트를 5점 만점의 별점으로 변환 (100% = 5점)
      rating = (percentValue / 100) * 5;
      // 소수점 한 자리까지 표시
      rating = Math.round(rating * 10) / 10;
    }
  }

  // 데이터를 JSON으로 변환
  return {
    title,
    price,
    imageUrls,
    description: modelName,
    rating
  };
}

// 쿠팡 파트너스 API 관련 함수
async function createCoupangDeeplink(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'createDeeplink', url },
      response => {
        if (response && response.success) {
          resolve(response.link);
        } else {
          reject(new Error(response?.error || '링크 생성에 실패했습니다.'));
        }
      }
    );
  });
}

// 플로팅 버튼 생성
function createFloatingButtons() {
  // 쿠팡링크만들기 버튼
  const coupangLinkButton = document.createElement('button');
  coupangLinkButton.id = 'createCoupangLink';
  coupangLinkButton.className = 'floating-button coupang-link-button';
  coupangLinkButton.textContent = '쿠팡링크만들기';
  
  coupangLinkButton.addEventListener('click', async () => {
    try {
      coupangLinkButton.textContent = '링크 생성 중...';
      coupangLinkButton.disabled = true;
      
      const currentUrl = window.location.href;
      const partnerLink = await createCoupangDeeplink(currentUrl);
      
      await navigator.clipboard.writeText(partnerLink);
      
      // 성공 메시지 표시
      coupangLinkButton.textContent = '링크 복사 완료!';
      coupangLinkButton.classList.add('success');
      
      setTimeout(() => {
        coupangLinkButton.textContent = '쿠팡링크만들기';
        coupangLinkButton.classList.remove('success');
        coupangLinkButton.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Error creating Coupang link:', error);
      
      // 에러 메시지 표시
      coupangLinkButton.textContent = '링크 생성 실패';
      coupangLinkButton.classList.add('error');
      
      setTimeout(() => {
        coupangLinkButton.textContent = '쿠팡링크만들기';
        coupangLinkButton.classList.remove('error');
        coupangLinkButton.disabled = false;
      }, 2000);
    }
  });
  
  // 상품 정보 복사 버튼
  const copyButton = document.createElement('button');
  copyButton.id = 'copyProductInfo';
  copyButton.className = 'floating-button copy-button';
  copyButton.textContent = '상품 정보 복사';
  
  copyButton.addEventListener('click', async () => {
    try {
      const productInfo = extractProductInfo();
      await navigator.clipboard.writeText(JSON.stringify(productInfo));
      
      // 성공 메시지 표시
      copyButton.textContent = '복사 완료!';
      copyButton.classList.add('success');
      
      setTimeout(() => {
        copyButton.textContent = '상품 정보 복사';
        copyButton.classList.remove('success');
      }, 2000);
    } catch (error) {
      console.error('Error copying product info:', error);
      
      // 에러 메시지 표시
      copyButton.textContent = '복사 실패';
      copyButton.classList.add('error');
      
      setTimeout(() => {
        copyButton.textContent = '상품 정보 복사';
        copyButton.classList.remove('error');
      }, 2000);
    }
  });
  
  // 버튼 컨테이너 생성
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'floating-button-container';
  buttonContainer.appendChild(coupangLinkButton);
  buttonContainer.appendChild(copyButton);
  
  document.body.appendChild(buttonContainer);
}

// 페이지 로드 시 플로팅 버튼 생성
createFloatingButtons();
  