/**
 * Thuật toán phân tích phả hệ và xưng hô thuần Việt
 * Quy tắc: "Bé bằng củ khoai, cứ vai mà gọi" - Trọng tôn ti trật tự gia tộc
 */

export function calculateKinship(personA, personB, members) {
  if (!personA || !personB) return null;
  if (personA.id === personB.id) {
    return {
      relation: "Chính mình",
      callAtoB: "Bản thân",
      callBtoA: "Bản thân",
      explanation: "Đây là cùng một người trong gia phả."
    };
  }

  const memberMap = new Map(members.map(m => [m.id, m]));

  // 1. Vợ - Chồng
  if (personA.spouseIds && personA.spouseIds.includes(personB.id)) {
    return {
      relation: "Vợ chồng",
      callAtoB: personB.gender === 'female' ? "Vợ / Bà xã" : "Chồng / Ông xã",
      callBtoA: personA.gender === 'female' ? "Vợ / Bà xã" : "Chồng / Ông xã",
      explanation: `${personA.fullName} và ${personB.fullName} là quan hệ hôn phối vợ chồng.`
    };
  }

  // 2. Cha/Mẹ - Con
  if (personB.fatherId === personA.id || personB.motherId === personA.id) {
    const parentTitle = personA.gender === 'male' ? "Cha / Bố" : "Mẹ";
    const childTitle = personB.gender === 'male' ? "Con trai" : "Con gái";
    return {
      relation: "Cha Mẹ - Con",
      callAtoB: childTitle,
      callBtoA: parentTitle,
      explanation: `${personA.fullName} là bậc sinh thành của ${personB.fullName}.`
    };
  }

  if (personA.fatherId === personB.id || personA.motherId === personB.id) {
    const parentTitle = personB.gender === 'male' ? "Cha / Bố" : "Mẹ";
    const childTitle = personA.gender === 'male' ? "Con trai" : "Con gái";
    return {
      relation: "Con - Cha Mẹ",
      callAtoB: parentTitle,
      callBtoA: childTitle,
      explanation: `${personB.fullName} là bậc sinh thành của ${personA.fullName}.`
    };
  }

  // 3. Ông/Bà - Cháu (Chênh 2 đời trực hệ)
  const bFather = personB.fatherId ? memberMap.get(personB.fatherId) : null;
  const bMother = personB.motherId ? memberMap.get(personB.motherId) : null;
  if (bFather && (bFather.fatherId === personA.id || bFather.motherId === personA.id)) {
    const grandTitle = personA.gender === 'male' ? "Ông nội" : "Bà nội";
    return {
      relation: "Ông Bà Nội - Cháu",
      callAtoB: "Cháu nội",
      callBtoA: grandTitle,
      explanation: `${personA.fullName} là ${grandTitle.toLowerCase()} của ${personB.fullName}.`
    };
  }
  if (bMother && (bMother.fatherId === personA.id || bMother.motherId === personA.id)) {
    const grandTitle = personA.gender === 'male' ? "Ông ngoại" : "Bà ngoại";
    return {
      relation: "Ông Bà Ngoại - Cháu",
      callAtoB: "Cháu ngoại",
      callBtoA: grandTitle,
      explanation: `${personA.fullName} là ${grandTitle.toLowerCase()} của ${personB.fullName}.`
    };
  }

  // 4. Anh/Chị/Em ruột (Cùng cha hoặc cùng mẹ)
  const isSiblings = (personA.fatherId && personA.fatherId === personB.fatherId) ||
                     (personA.motherId && personA.motherId === personB.motherId);
  if (isSiblings) {
    const aOlder = (personA.birthOrder || 99) < (personB.birthOrder || 99) || 
                   (Number(personA.birthYear) || 9999) < (Number(personB.birthYear) || 9999);
    if (aOlder) {
      const aTitle = personA.gender === 'male' ? "Anh ruột" : "Chị ruột";
      const bTitle = personB.gender === 'male' ? "Em trai" : "Em gái";
      return {
        relation: "Anh Chị Em ruột",
        callAtoB: bTitle,
        callBtoA: aTitle,
        explanation: `${personA.fullName} là anh/chị sinh trước trong cùng gia đình.`
      };
    } else {
      const bTitle = personB.gender === 'male' ? "Anh ruột" : "Chị ruột";
      const aTitle = personA.gender === 'male' ? "Em trai" : "Em gái";
      return {
        relation: "Anh Chị Em ruột",
        callAtoB: bTitle,
        callBtoA: aTitle,
        explanation: `${personB.fullName} là anh/chị sinh trước trong cùng gia đình.`
      };
    }
  }

  // 5. Tính theo thế hệ (Generation Difference)
  const genDiff = personB.generation - personA.generation;

  // Cùng thế hệ (Anh chị em họ / Chú bác họ)
  if (genDiff === 0) {
    // Xét chi nhánh họ hàng
    const aIsBranchHead = personA.branch === 'Chi Trưởng' || (personA.birthOrder || 99) < (personB.birthOrder || 99);
    if (aIsBranchHead) {
      const aTitle = personA.gender === 'male' ? "Anh họ (vế trên)" : "Chị họ (vế trên)";
      const bTitle = "Em họ";
      return {
        relation: "Anh Chị Em họ (Đồng bối)",
        callAtoB: bTitle,
        callBtoA: aTitle,
        explanation: `Theo gia lễ Việt Nam, chi Trưởng ở vế trên nên ${personB.fullName} xưng là em và gọi ${personA.fullName} là ${aTitle.split(' ')[0]}.`
      };
    } else {
      const bTitle = personB.gender === 'male' ? "Anh họ (vế trên)" : "Chị họ (vế trên)";
      const aTitle = "Em họ";
      return {
        relation: "Anh Chị Em họ (Đồng bối)",
        callAtoB: bTitle,
        callBtoA: aTitle,
        explanation: `Theo gia lễ Việt Nam, ${personB.fullName} ở vế trên nên ${personA.fullName} gọi là ${bTitle.split(' ')[0]}.`
      };
    }
  }

  // Chênh 1 thế hệ (Bác, Chú, Cô, Cậu vs Cháu)
  if (genDiff === 1) {
    let titleA = "Chú / Bác họ";
    if (personA.gender === 'female') {
      titleA = "Cô họ";
    } else {
      if (personA.birthOrder === 1 || personA.branch === 'Chi Trưởng') {
        titleA = "Bác họ (Trưởng chi)";
      } else {
        titleA = "Chú họ";
      }
    }
    return {
      relation: "Hàng Chú Bác - Cháu họ",
      callAtoB: "Cháu",
      callBtoA: titleA,
      explanation: `${personA.fullName} thuộc đời thứ ${personA.generation}, là hàng bề trên của ${personB.fullName} (đời thứ ${personB.generation}).`
    };
  }

  if (genDiff === -1) {
    let titleB = "Chú / Bác họ";
    if (personB.gender === 'female') {
      titleB = "Cô họ";
    } else {
      if (personB.birthOrder === 1 || personB.branch === 'Chi Trưởng') {
        titleB = "Bác họ (Trưởng chi)";
      } else {
        titleB = "Chú họ";
      }
    }
    return {
      relation: "Hàng Cháu - Chú Bác họ",
      callAtoB: titleB,
      callBtoA: "Cháu",
      explanation: `${personB.fullName} thuộc đời thứ ${personB.generation}, là bề trên của ${personA.fullName} (đời thứ ${personA.generation}).`
    };
  }

  // Chênh 2 thế hệ trở lên (Hàng Ông / Cụ / Tiên Tổ)
  if (genDiff >= 2) {
    const rankTitle = genDiff === 2 ? (personA.gender === 'male' ? "Ông chú / Ông bác" : "Bà cô họ") : `Cụ Tiên Tổ (Đời thứ ${personA.generation})`;
    return {
      relation: `Bề Trên (Cách biệt ${genDiff} đời)`,
      callAtoB: "Cháu / Chắt dòng họ",
      callBtoA: rankTitle,
      explanation: `${personA.fullName} thuộc bậc tiền bối đời ${personA.generation}, là cụ tổ bậc trên của ${personB.fullName} đời ${personB.generation}.`
    };
  }

  if (genDiff <= -2) {
    const rankTitle = Math.abs(genDiff) === 2 ? (personB.gender === 'male' ? "Ông chú / Ông bác" : "Bà cô họ") : `Cụ Tiên Tổ (Đời thứ ${personB.generation})`;
    return {
      relation: `Bề Dưới (Cách biệt ${Math.abs(genDiff)} đời)`,
      callAtoB: rankTitle,
      callBtoA: "Cháu / Chắt dòng họ",
      explanation: `${personB.fullName} thuộc bậc tiền bối đời ${personB.generation}, ${personA.fullName} là con cháu đời sau.`
    };
  }

  return {
    relation: "Đồng tộc",
    callAtoB: "Người trong họ",
    callBtoA: "Người trong họ",
    explanation: "Cùng mang dòng máu gia tộc Nguyễn Đại Tộc."
  };
}
