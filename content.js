function extractProductInfo() {
  // 상품명 추출
  const title = document.querySelector('.prod-buy-header__title')?.textContent?.trim();

  // 가격 추출 (원 제거)
  const price = document.querySelector('.total-price')?.textContent?.trim()
      .replace('원', '').replace(/,/g, '');

  // 이미지 URL 추출 (최대 4개)
  const imageUrls = [];
  document.querySelectorAll('.prod-image__item img').forEach((img, index) => {
    if (index < 4 && img.src) {
      // URL을 https://로 시작하도록 변경하고 이미지 크기를 492x492ex로 고정
      const imgUrl = img.src
          .replace(/^\/\//, 'https://')
          .replace(/\/\d+x\d+ex\//, '/492x492ex/');
      imageUrls.push(imgUrl);
    }
  });

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
  
  // 플로팅 버튼 생성
  function createFloatingButton() {
    const button = document.createElement('button');
    button.id = 'copyProductInfo';
    button.className = 'floating-button';
    button.textContent = '상품 정보 복사';
    
    button.addEventListener('click', async () => {
      try {
        const productInfo = extractProductInfo();
        await navigator.clipboard.writeText(JSON.stringify(productInfo));
        
        // 성공 메시지 표시
        button.textContent = '복사 완료!';
        button.classList.add('success');
        
        setTimeout(() => {
          button.textContent = '상품 정보 복사';
          button.classList.remove('success');
        }, 2000);
      } catch (error) {
        console.error('Error copying product info:', error);
        
        // 에러 메시지 표시
        button.textContent = '복사 실패';
        button.classList.add('error');
        
        setTimeout(() => {
          button.textContent = '상품 정보 복사';
          button.classList.remove('error');
        }, 2000);
      }
    });
  
    document.body.appendChild(button);
  }
  
  // 페이지 로드 시 플로팅 버튼 생성
  createFloatingButton();
  